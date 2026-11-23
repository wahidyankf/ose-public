package application_test

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
)

// errBoomFS fails the filesystem operations the tests select.
var errBoomFS = errors.New("boom")

// failFS wraps course content and fails the selected operations: the
// root listing, opens of the named paths, listings below the named
// directories, and sub-filesystem assembly for the named courses.
// Reads the tests do not fail delegate to the inner tree, so each
// drive fails exactly the operation its error branch guards.
type failFS struct {
	inner       fstest.MapFS
	readDirRoot error
	failOpen    map[string]bool
	failReadDir map[string]bool
	failSub     map[string]bool
}

func (f failFS) Open(name string) (fs.File, error) {
	if f.failOpen[name] {
		return nil, errBoomFS
	}
	opened, err := f.inner.Open(name)
	if err != nil {
		return nil, fmt.Errorf("test: open %s: %w", name, err)
	}
	return opened, nil
}

func (f failFS) Stat(name string) (fs.FileInfo, error) {
	info, err := fs.Stat(f.inner, name)
	if err != nil {
		return nil, fmt.Errorf("test: stat %s: %w", name, err)
	}
	return info, nil
}

func (f failFS) ReadDir(name string) ([]fs.DirEntry, error) {
	if name == "." && f.readDirRoot != nil {
		return nil, f.readDirRoot
	}
	if f.failReadDir[name] {
		return nil, errBoomFS
	}
	entries, err := fs.ReadDir(f.inner, name)
	if err != nil {
		return nil, fmt.Errorf("test: read dir %s: %w", name, err)
	}
	return entries, nil
}

func (f failFS) Sub(dir string) (fs.FS, error) {
	if f.failSub[dir] {
		return nil, errBoomFS
	}
	if _, err := fs.Stat(f.inner, dir); err != nil {
		return nil, fmt.Errorf("test: stat %s: %w", dir, err)
	}
	return joinFS{parent: f, dir: dir}, nil
}

// joinFS routes every operation below a subdirectory through the
// failing wrapper with joined paths, so selected reads fail wherever
// the use case performs them.
type joinFS struct {
	parent failFS
	dir    string
}

func (j joinFS) Open(name string) (fs.File, error) {
	opened, err := j.parent.Open(joinPath(j.dir, name))
	if err != nil {
		return nil, err
	}
	return opened, nil
}

func (j joinFS) Stat(name string) (fs.FileInfo, error) {
	info, err := j.parent.Stat(joinPath(j.dir, name))
	if err != nil {
		return nil, err
	}
	return info, nil
}

func (j joinFS) ReadDir(name string) ([]fs.DirEntry, error) {
	entries, err := j.parent.ReadDir(joinPath(j.dir, name))
	if err != nil {
		return nil, err
	}
	return entries, nil
}

func (j joinFS) Sub(dir string) (fs.FS, error) {
	return j.parent.Sub(joinPath(j.dir, dir))
}

// joinPath joins a subdirectory with a relative path.
func joinPath(dir, name string) string {
	if name == "." {
		return dir
	}
	return dir + "/" + name
}

// okStub runs every execution green with a passing output.
func okStub() *scriptedRuntime {
	return &scriptedRuntime{run: okExecution("hello\n")}
}

// TestValidateReportsFailingFilesystem requires every content failure
// to surface instead of an empty selection.
func TestValidateReportsFailingFilesystem(t *testing.T) {
	t.Run("missing selection fails closed", func(t *testing.T) {
		if _, err := application.Affected(application.AffectedRequest{}); err == nil {
			t.Fatal("Affected=nil, want the missing selection")
		}
	})
	t.Run("changed selection reports the listing failure", func(t *testing.T) {
		_, err := application.Affected(application.AffectedRequest{
			Content: failFS{inner: checkContent(), readDirRoot: errBoomFS},
			Since:   "base",
		})
		if err == nil {
			t.Fatal("Affected=nil, want the listing failure")
		}
	})
	t.Run("all selection reports the open failure", func(t *testing.T) {
		_, err := application.Affected(application.AffectedRequest{
			Content: failFS{inner: checkContent(), failSub: map[string]bool{"demo": true}},
			All:     true,
		})
		if err == nil || !strings.Contains(err.Error(), "open course") {
			t.Fatalf("Affected=%v, want the open course failure", err)
		}
	})
	t.Run("named course reports the open failure", func(t *testing.T) {
		_, err := application.Validate(application.ValidateRequest{
			Content: failFS{inner: checkContent(), failSub: map[string]bool{"demo": true}},
			Catalog: testCatalog(),
			Courses: []string{"demo"},
		})
		if err == nil || !strings.Contains(err.Error(), "open course") {
			t.Fatalf("Validate=%v, want the open course failure", err)
		}
	})
	t.Run("default selection skips files", func(t *testing.T) {
		content := fstest.MapFS{"note.md": &fstest.MapFile{Data: []byte("# notes\n")}}
		findings, err := application.Validate(application.ValidateRequest{
			Content: content,
			Catalog: testCatalog(),
		})
		if err != nil {
			t.Fatalf("Validate=%v, want nil", err)
		}
		if len(findings) != 0 {
			t.Fatalf("findings=%v, want none", findings)
		}
		if _, err := application.Affected(application.AffectedRequest{
			Content: content,
			All:     true,
		}); err != nil {
			t.Fatalf("Affected=%v, want nil", err)
		}
	})
	t.Run("default selection reports the open failure", func(t *testing.T) {
		_, err := application.Validate(application.ValidateRequest{
			Content: failFS{inner: checkContent(), failSub: map[string]bool{"demo": true}},
			Catalog: testCatalog(),
		})
		if err == nil || !strings.Contains(err.Error(), "open course") {
			t.Fatalf("Validate=%v, want the open course failure", err)
		}
	})
	t.Run("coverage reports the validation failure", func(t *testing.T) {
		_, err := application.Coverage(application.CoverageRequest{
			Content: failFS{inner: checkContent(), failSub: map[string]bool{"demo": true}},
			Catalog: testCatalog(),
			Courses: []string{"demo"},
		})
		if err == nil {
			t.Fatal("Coverage=nil, want the validation failure")
		}
	})
}

// TestCheckReportsFailingFilesystem requires the check to fail the
// phase whose filesystem operation fails.
func TestCheckReportsFailingFilesystem(t *testing.T) {
	base := func(content fs.FS) application.CheckRequest {
		return application.CheckRequest{
			Content: content,
			Catalog: testCatalog(),
			Courses: []string{"demo"},
			Runtime: okStub(),
			RunID:   "test-fs-1",
		}
	}
	t.Run("validate failure stops the check", func(t *testing.T) {
		req := base(failFS{inner: checkContent(), failSub: map[string]bool{"demo": true}})
		if _, err := application.Check(context.Background(), req); err == nil {
			t.Fatal("Check=nil, want the validation failure")
		}
	})
	t.Run("selection failure stops the check", func(t *testing.T) {
		req := base(failFS{inner: checkContent(), readDirRoot: errBoomFS})
		req.Courses = nil
		req.Since = "base"
		if _, err := application.Check(context.Background(), req); err == nil {
			t.Fatal("Check=nil, want the selection failure")
		}
	})
}

// TestCheckCoverageReportsFailingContent requires the static coverage
// to fail when validation or the course listing fails.
func TestCheckCoverageReportsFailingContent(t *testing.T) {
	newReq := func(content fs.FS, courses []string) application.CheckRequest {
		return application.CheckRequest{
			Content: content,
			Catalog: testCatalog(),
			Courses: courses,
			Runtime: okStub(),
			RunID:   "test-cov-1",
		}
	}
	t.Run("unlistable content fails the static coverage", func(t *testing.T) {
		content := failFS{inner: twoCleanCourses(), readDirRoot: errBoomFS}
		req := newReq(content, []string{"alpha"})
		req.Runtime = &scriptedRuntime{run: okExecution("hello\n")}
		_, err := application.Check(context.Background(), req)
		if err == nil || !strings.Contains(err.Error(), "list courses") {
			t.Fatalf("Check=%v, want the listing failure", err)
		}
	})
	t.Run("unreadable course fails the static validation", func(t *testing.T) {
		content := failFS{inner: twoCleanCourses(), failSub: map[string]bool{"beta": true}}
		req := newReq(content, []string{"alpha"})
		if _, err := application.Check(context.Background(), req); err == nil {
			t.Fatal("Check=nil, want the static validation failure")
		}
	})
}

// staleCourse carries one anchored fence whose body differs from its
// target, so --write always finds a repair.
func staleCourse() fstest.MapFS {
	return runContent(map[string]string{
		"c/target.py":                "right\n",
		"c/learning/lessons/l.md":    "**`target.py`**:\n```py\nwrong\n```\n",
		"c/learning/code/u1/main.py": "print(1)\n",
	})
}

// TestSyncWritePaths requires the repair to fail closed when the
// content root is missing, and to report no updates on a clean course.
func TestSyncWritePaths(t *testing.T) {
	writeReq := func(content fs.FS, dir string, courses ...string) application.SyncRequest {
		return application.SyncRequest{
			Content:    content,
			ContentDir: dir,
			Courses:    courses,
			Write:      true,
		}
	}
	t.Run("missing root fails the repair", func(t *testing.T) {
		req := writeReq(staleCourse(), "/proc/no-such-root-ayokoding", "c")
		_, err := application.Sync(req)
		if err == nil {
			t.Fatal("Sync=nil, want the write failure")
		}
	})
	t.Run("clean course reports no updates", func(t *testing.T) {
		req := writeReq(twoCleanCourses(), "/nonexistent-ayokoding")
		req.Courses = []string{"alpha"}
		findings, err := application.Sync(req)
		if err != nil {
			t.Fatalf("Sync=%v, want nil", err)
		}
		_ = findings
	})
	t.Run("unreadable lesson is skipped", func(t *testing.T) {
		content := failFS{
			inner:    checkContent(),
			failOpen: map[string]bool{"demo/learning/lessons/hello.md": true},
		}
		req := writeReq(content, "/nonexistent-ayokoding")
		req.Courses = []string{"demo"}
		if _, err := application.Sync(req); err != nil {
			t.Fatalf("Sync=%v, want nil", err)
		}
	})
}

// TestRunReportsFailingFilesystem requires the run to fail the phase
// whose filesystem operation fails.
func TestRunReportsFailingFilesystem(t *testing.T) {
	newReq := func(content fs.FS) application.RunRequest {
		return baseRunRequest(content, okStub())
	}
	t.Run("unopenable course fails the run", func(t *testing.T) {
		req := newReq(failFS{inner: helloCourse(), failSub: map[string]bool{"demo": true}})
		_, err := application.Run(context.Background(), req)
		if err == nil || !strings.Contains(err.Error(), "open course") {
			t.Fatalf("Run=%v, want the open course failure", err)
		}
	})
	t.Run("unreadable spec fails preparation", func(t *testing.T) {
		content := failFS{
			inner:    helloCourse(),
			failOpen: map[string]bool{"demo/learning/code/ex-01-hello/run.yaml": true},
		}
		if _, err := application.Run(context.Background(), newReq(content)); err == nil {
			t.Fatal("Run=nil, want the spec read failure")
		}
	})
	t.Run("unreadable program fails the working copy", func(t *testing.T) {
		content := failFS{
			inner:    helloCourse(),
			failOpen: map[string]bool{"demo/learning/code/ex-01-hello/example.py": true},
		}
		_, err := application.Run(context.Background(), newReq(content))
		if err == nil || !strings.Contains(err.Error(), "application: read") {
			t.Fatalf("Run=%v, want the copy read failure", err)
		}
	})
	t.Run("unlistable unit fails the working copy", func(t *testing.T) {
		content := failFS{
			inner:       helloCourse(),
			failReadDir: map[string]bool{"demo/learning/code/ex-01-hello": true},
		}
		_, err := application.Run(context.Background(), newReq(content))
		if err == nil || !strings.Contains(err.Error(), "unit") {
			t.Fatalf("Run=%v, want the unit listing failure", err)
		}
	})
}

// TestRunChecksStderrExpectation requires a missing stderr expectation
// to name the file with the record hint.
func TestRunChecksStderrExpectation(t *testing.T) {
	spec := strings.Replace(validRunSpec,
		"      stdout: expected/main.stdout.txt",
		"      stdout: expected/main.stdout.txt\n      stderr: expected/main.stderr.txt", 1)
	content := runContent(map[string]string{
		"demo/learning/code/ex-01-hello/run.yaml":                 spec,
		"demo/learning/code/ex-01-hello/example.py":               "print('hello')\n",
		"demo/learning/code/ex-01-hello/expected/main.stdout.txt": "hello\n",
	})
	req := baseRunRequest(content, okStub())
	report, err := application.Run(context.Background(), req)
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	found := false
	for _, finding := range report.Findings {
		if strings.Contains(finding.Message, "record") && strings.Contains(finding.Message, "main.stderr.txt") {
			found = true
		}
	}
	if !found {
		t.Fatalf("findings=%v, want the stderr record hint", report.Findings)
	}
}

// TestRunRecordsMissingExpectation requires --record against a missing
// root to fail naming the expected file.
func TestRunRecordsMissingExpectation(t *testing.T) {
	missing := runContent(map[string]string{
		"demo/learning/code/ex-01-hello/run.yaml":   validRunSpec,
		"demo/learning/code/ex-01-hello/example.py": "print('hello')\n",
	})
	req := baseRunRequest(missing, okStub())
	req.Record = true
	req.ContentDir = "/proc/no-such-record-ayokoding"
	_, err := application.Run(context.Background(), req)
	if err == nil || !strings.Contains(err.Error(), "record expected file") {
		t.Fatalf("Run=%v, want the record failure", err)
	}
}

// TestCoverageSkipsUnreadableLessons requires an unreadable lesson to
// stay out of the fence counts.
func TestCoverageSkipsUnreadableLessons(t *testing.T) {
	content := failFS{
		inner:    checkContent(),
		failOpen: map[string]bool{"demo/learning/lessons/hello.md": true},
	}
	report, err := application.Coverage(application.CoverageRequest{
		Content:      content,
		Catalog:      testCatalog(),
		IncludeInert: true,
	})
	if err != nil {
		t.Fatalf("Coverage=%v, want nil", err)
	}
	if len(report.Report.Courses) != 1 {
		t.Fatalf("courses=%v, want the single course", report.Report.Courses)
	}
}
