package application_test

import (
	"context"
	"errors"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/coverage"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/selection"
)

// checkLesson anchors the demo example with its expected output, so the
// green course stays silent in every phase.
const checkLesson = "# Demo\n\n**`learning/code/ex-01-hello/example.py`**\n\n" +
	"```python\nprint('hello')\n```\n\n**Output** (`learning/code/ex-01-hello/expected/main.stdout.txt`):\n\n" +
	"```text\nhello\n```\n"

// checkContent holds one clean course: the unit, its expected file, and
// the lesson anchoring both.
func checkContent() fstest.MapFS {
	return runContent(map[string]string{
		"demo/learning/code/ex-01-hello/run.yaml":                 validRunSpec,
		"demo/learning/code/ex-01-hello/example.py":               "print('hello')\n",
		"demo/learning/code/ex-01-hello/expected/main.stdout.txt": "hello\n",
		"demo/learning/lessons/hello.md":                          checkLesson,
	})
}

// checkRequest selects the demo course with the scripted runtime.
func checkRequest(fake *scriptedRuntime) application.CheckRequest {
	return application.CheckRequest{
		Content: checkContent(),
		Catalog: testCatalog(),
		Courses: []string{"demo"},
		Runtime: fake,
		RunID:   "test-check-1",
	}
}

// TestCheckRunsNamedCourseGreen requires a clean course to check with no
// finding and one green run.
func TestCheckRunsNamedCourseGreen(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	report, err := application.Check(context.Background(), checkRequest(fake))
	if err != nil {
		t.Fatalf("Check=%v, want nil", err)
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
	if len(report.Passed) != 1 {
		t.Fatalf("passed=%+v, want one green run", report.Passed)
	}
}

// TestCheckRequiresSelection requires the missing-selection usage error
// when neither --course nor --all names a course.
func TestCheckRequiresSelection(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("1\n")}
	req := checkRequest(fake)
	req.Courses = nil
	_, err := application.Check(context.Background(), req)
	var coded *finding.Error
	if !errors.As(err, &coded) || coded.Code != finding.UsageMissingSelection {
		t.Fatalf("err=%v, want %q", err, finding.UsageMissingSelection)
	}
}

// TestCheckPropagatesProbeFailure requires a refused daemon to stop the
// check with the environment status.
func TestCheckPropagatesProbeFailure(t *testing.T) {
	fake := &scriptedRuntime{
		run:      okExecution("1\n"),
		probeErr: &finding.Error{Code: finding.EnvRuntimeRefused, Message: "daemon unreachable"},
	}
	_, err := application.Check(context.Background(), checkRequest(fake))
	if finding.ExitCode(err) != 125 {
		t.Fatalf("exit=%d, want 125", finding.ExitCode(err))
	}
}

// TestCheckReportsInvalidSpec requires the beta unknown key to fail the
// check with its finding.
func TestCheckReportsInvalidSpec(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("1\n")}
	req := checkRequest(fake)
	req.Content = testContent()
	req.Courses = []string{"beta"}
	report, err := application.Check(context.Background(), req)
	if err != nil {
		t.Fatalf("Check=%v, want nil", err)
	}
	if !report.Failed() {
		t.Fatalf("report=%+v, want findings", report)
	}
	requireFinding(t, application.RunReport{Findings: report.Findings}, "ayokoding.runspec.unknown-key", "expected_output")
}

// TestCheckAllSkipsInert requires --all to check every opted-in course
// while the inert gamma stays out of the report.
func TestCheckAllSkipsInert(t *testing.T) {
	content := checkContent()
	for name, body := range testContent() {
		if len(name) >= 5 && name[:5] == "gamma" {
			content[name] = body
		}
	}
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := checkRequest(fake)
	req.Content = content
	req.Courses = nil
	req.All = true
	report, err := application.Check(context.Background(), req)
	if err != nil {
		t.Fatalf("Check=%v, want nil", err)
	}
	for _, found := range report.Findings {
		if found.Course == "gamma" {
			t.Fatalf("finding=%+v, inert gamma must be skipped", found)
		}
	}
	for _, passed := range report.Passed {
		if passed.Course == "gamma" {
			t.Fatalf("passed=%+v, inert gamma must be skipped", passed)
		}
	}
	if len(report.Passed) != 1 || report.Passed[0].Course != "demo" {
		t.Fatalf("passed=%+v, want the demo run", report.Passed)
	}
}

// twoCleanCourses holds two clean opted-in courses with anchored lessons
// and one inert course: the selection tests run the scripted runtime over
// whatever the selection names.
func twoCleanCourses() fstest.MapFS {
	content := fstest.MapFS{}
	for _, slug := range []string{"alpha", "beta"} {
		content[slug+"/learning/code/ex-01-hello/run.yaml"] = &fstest.MapFile{Data: []byte(validRunSpec)}
		content[slug+"/learning/code/ex-01-hello/example.py"] = &fstest.MapFile{Data: []byte("print('hello')\n")}
		content[slug+"/learning/code/ex-01-hello/expected/main.stdout.txt"] = &fstest.MapFile{Data: []byte("hello\n")}
		content[slug+"/learning/lessons/hello.md"] = &fstest.MapFile{Data: []byte(checkLesson)}
	}
	content["gamma/learning/code/ex-01-g/main.py"] = &fstest.MapFile{Data: []byte("print(1)\n")}
	content["gamma/learning/lessons/g.md"] = &fstest.MapFile{Data: []byte("# G\n")}
	return content
}

// sinceRequest selects the changed courses since a base revision through
// the injected changed paths.
func sinceRequest(fake *scriptedRuntime, changed []string) application.CheckRequest {
	req := checkRequest(fake)
	req.Content = twoCleanCourses()
	req.Courses = nil
	req.Since = "base"
	req.ChangedFiles = changed
	req.ContentPrefix = "courses"
	return req
}

// TestCheckSinceRunsChangedOptedIn requires --since to validate and sync
// every opted-in course while running only the changed one.
func TestCheckSinceRunsChangedOptedIn(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := sinceRequest(fake, []string{"courses/alpha/learning/lessons/hello.md"})
	report, err := application.Check(context.Background(), req)
	if err != nil {
		t.Fatalf("Check=%v, want nil", err)
	}
	if report.Selection.Mode != selection.ModeAffected {
		t.Fatalf("mode=%q, want affected", report.Selection.Mode)
	}
	if len(report.Passed) != 1 || report.Passed[0].Course != "alpha" {
		t.Fatalf("passed=%+v, want only the alpha run", report.Passed)
	}
}

// TestCheckSinceListsInert requires a changed course without a run spec
// to list as inert instead of running.
func TestCheckSinceListsInert(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := sinceRequest(fake, []string{
		"courses/alpha/learning/lessons/hello.md",
		"courses/gamma/learning/lessons/g.md",
	})
	report, err := application.Check(context.Background(), req)
	if err != nil {
		t.Fatalf("Check=%v, want nil", err)
	}
	if len(report.Selection.Inert) != 1 || report.Selection.Inert[0] != "gamma" {
		t.Fatalf("inert=%q, want exactly gamma", report.Selection.Inert)
	}
	for _, passed := range report.Passed {
		if passed.Course == "gamma" {
			t.Fatalf("passed=%+v, inert gamma must never run", passed)
		}
	}
}

// TestCheckShardRunsSubset requires --shard to run only its slice of the
// selection.
func TestCheckShardRunsSubset(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := checkRequest(fake)
	req.Content = twoCleanCourses()
	req.Courses = nil
	req.All = true
	req.Shard = "2/2"
	report, err := application.Check(context.Background(), req)
	if err != nil {
		t.Fatalf("Check=%v, want nil", err)
	}
	if len(report.Passed) != 1 || report.Passed[0].Course != "beta" {
		t.Fatalf("passed=%+v, want only the beta run", report.Passed)
	}
	if len(report.Selection.Courses) != 1 || report.Selection.Courses[0] != "beta" {
		t.Fatalf("selection=%q, want only beta", report.Selection.Courses)
	}
}

// TestCheckInvalidShardIsUsageError requires a malformed shard to fail
// before any runtime call.
func TestCheckInvalidShardIsUsageError(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := checkRequest(fake)
	req.Content = twoCleanCourses()
	req.Courses = nil
	req.All = true
	req.Shard = "bogus"
	_, err := application.Check(context.Background(), req)
	if finding.ExitCode(err) != 2 {
		t.Fatalf("err=%v, want a usage error", err)
	}
	if len(fake.calls) != 0 {
		t.Fatalf("calls=%d, want no runtime call", len(fake.calls))
	}
}

// TestCheckInertMessageSkipsRuntime requires a tree with no opted-in
// course to report the inert message with no runtime call.
func TestCheckInertMessageSkipsRuntime(t *testing.T) {
	content := fstest.MapFS{}
	for name, body := range testContent() {
		if strings.HasPrefix(name, "gamma/") {
			content[name] = body
		}
	}
	fake := &scriptedRuntime{
		run:      okExecution("hello\n"),
		probeErr: &finding.Error{Code: finding.EnvRuntimeRefused, Message: "daemon unreachable"},
	}
	req := checkRequest(fake)
	req.Content = content
	req.Courses = nil
	req.All = true
	report, err := application.Check(context.Background(), req)
	if err != nil {
		t.Fatalf("Check=%v, want nil", err)
	}
	if report.Message != application.InertMessage {
		t.Fatalf("message=%q, want the inert message", report.Message)
	}
	if report.Message != "0 opted-in courses; nothing to run" {
		t.Fatalf("message=%q, want the contracted wording", report.Message)
	}
	if len(fake.calls) != 0 {
		t.Fatalf("calls=%d, want no runtime call", len(fake.calls))
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
}

// TestCheckCoverageAtMinimumZero requires the check coverage report to
// never fail the check: a half-covered tree reports no below-minimum
// finding.
func TestCheckCoverageAtMinimumZero(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := checkRequest(fake)
	req.Content = testContent()
	req.Courses = nil
	req.All = true
	report, err := application.Check(context.Background(), req)
	if err != nil {
		t.Fatalf("Check=%v, want nil", err)
	}
	if report.Coverage.Applicable == 0 {
		t.Fatalf("coverage=%+v, want applicable courses counted", report.Coverage)
	}
	for _, found := range report.Findings {
		if found.Code == coverage.CodeBelowMinimum {
			t.Fatalf("finding=%+v, minimum 0 never fails", found)
		}
	}
}

// TestAffectedResolvesModeAndCourses requires the affected preview to
// return the mode with the selected and inert courses.
func TestAffectedResolvesModeAndCourses(t *testing.T) {
	got, err := application.Affected(application.AffectedRequest{
		Content:       twoCleanCourses(),
		Since:         "base",
		ChangedFiles:  []string{"courses/alpha/learning/lessons/hello.md", "courses/gamma/learning/lessons/g.md"},
		ContentPrefix: "courses",
	})
	if err != nil {
		t.Fatalf("Affected=%v, want nil", err)
	}
	if got.Mode != selection.ModeAffected {
		t.Fatalf("mode=%q, want affected", got.Mode)
	}
	if len(got.Courses) != 1 || got.Courses[0] != "alpha" {
		t.Fatalf("courses=%q, want exactly alpha", got.Courses)
	}
	if len(got.Inert) != 1 || got.Inert[0] != "gamma" {
		t.Fatalf("inert=%q, want exactly gamma", got.Inert)
	}
}

// TestAffectedAllIsFull requires the --all preview to select every
// opted-in course in full mode.
func TestAffectedAllIsFull(t *testing.T) {
	got, err := application.Affected(application.AffectedRequest{
		Content: twoCleanCourses(),
		All:     true,
	})
	if err != nil {
		t.Fatalf("Affected=%v, want nil", err)
	}
	if got.Mode != selection.ModeFull {
		t.Fatalf("mode=%q, want full", got.Mode)
	}
	if len(got.Courses) != 2 || got.Courses[0] != "alpha" || got.Courses[1] != "beta" {
		t.Fatalf("courses=%q, want alpha and beta", got.Courses)
	}
}

// TestAffectedInvalidShardIsUsageError requires a malformed shard to be a
// usage error.
func TestAffectedInvalidShardIsUsageError(t *testing.T) {
	_, err := application.Affected(application.AffectedRequest{
		Content: twoCleanCourses(),
		All:     true,
		Shard:   "7/2",
	})
	if finding.ExitCode(err) != 2 {
		t.Fatalf("err=%v, want a usage error", err)
	}
}

// TestAffectedUnknownCourseIsUsageError requires a named course that does
// not exist to be a usage error.
func TestAffectedUnknownCourseIsUsageError(t *testing.T) {
	_, err := application.Affected(application.AffectedRequest{
		Content: twoCleanCourses(),
		Courses: []string{"zeta"},
	})
	var coded *finding.Error
	if !errors.As(err, &coded) || coded.Code != finding.UsageInvalidArguments {
		t.Fatalf("err=%v, want invalid arguments", err)
	}
}
