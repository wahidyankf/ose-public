package application_test

import (
	"context"
	"fmt"
	"io/fs"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
)

// countFS fails the Nth root listing or the Nth subtree assembly, so the
// use case reports the error its phase guards while every other operation
// reads the inner tree.
type countFS struct {
	inner      fstest.MapFS
	lists      int
	failListOn int
	subs       map[string]int
	failSubOn  map[string]int
}

func (f *countFS) Open(name string) (fs.File, error) {
	opened, err := f.inner.Open(name)
	if err != nil {
		return nil, fmt.Errorf("application test: open %q: %w", name, err)
	}
	return opened, nil
}

func (f *countFS) Stat(name string) (fs.FileInfo, error) {
	info, err := fs.Stat(f.inner, name)
	if err != nil {
		return nil, fmt.Errorf("application test: stat %q: %w", name, err)
	}
	return info, nil
}

func (f *countFS) ReadDir(name string) ([]fs.DirEntry, error) {
	if name == "." {
		f.lists++
		if f.failListOn != 0 && f.lists == f.failListOn {
			return nil, errBoomFS
		}
	}
	entries, err := fs.ReadDir(f.inner, name)
	if err != nil {
		return nil, fmt.Errorf("application test: read directory %q: %w", name, err)
	}
	return entries, nil
}

func (f *countFS) Sub(dir string) (fs.FS, error) {
	if f.subs == nil {
		f.subs = map[string]int{}
	}
	f.subs[dir]++
	if n := f.failSubOn[dir]; n != 0 && f.subs[dir] == n {
		return nil, errBoomFS
	}
	if _, err := fs.Stat(f.inner, dir); err != nil {
		return nil, fmt.Errorf("application test: stat %q: %w", dir, err)
	}
	return countJoinFS{parent: f, dir: dir}, nil
}

// countJoinFS routes every operation below a subdirectory through the
// counting wrapper with joined paths, so assembly counts stay exact
// wherever the use case performs them.
type countJoinFS struct {
	parent *countFS
	dir    string
}

func (j countJoinFS) Open(name string) (fs.File, error) {
	return j.parent.Open(joinPath(j.dir, name))
}

func (j countJoinFS) Stat(name string) (fs.FileInfo, error) {
	return j.parent.Stat(joinPath(j.dir, name))
}

func (j countJoinFS) ReadDir(name string) ([]fs.DirEntry, error) {
	return j.parent.ReadDir(joinPath(j.dir, name))
}

func (j countJoinFS) Sub(dir string) (fs.FS, error) {
	return j.parent.Sub(joinPath(j.dir, dir))
}

// quietCourse holds one inert course: a lesson with no run spec anywhere,
// so the check takes the inert path.
func quietCourse() fstest.MapFS {
	return fstest.MapFS{
		"quiet/learning/lessons/a.md": &fstest.MapFile{Data: []byte("# A\n")},
	}
}

// stderrExpectCourse carries one unit whose expected standard error file
// is missing from the tree, so the expectation comparison reads it.
func stderrExpectCourse() fstest.MapFS {
	content := fstest.MapFS{}
	content["demo/learning/code/ex-01-hello/run.yaml"] = &fstest.MapFile{Data: []byte(`schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, example.py]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
      stderr: expected/main.stderr.txt
`)}
	content["demo/learning/code/ex-01-hello/example.py"] = &fstest.MapFile{Data: []byte("print('hello')\n")}
	content["demo/learning/code/ex-01-hello/expected/main.stdout.txt"] = &fstest.MapFile{Data: []byte("hello\n")}
	return content
}

// recordCourse carries one unit with no expected file on disk, so
// --record writes the actual output.
func recordCourse() fstest.MapFS {
	content := fstest.MapFS{}
	content["demo/learning/code/ex-01-hello/run.yaml"] = &fstest.MapFile{Data: []byte(validRunSpec)}
	content["demo/learning/code/ex-01-hello/example.py"] = &fstest.MapFile{Data: []byte("print('hello')\n")}
	return content
}

// notesCourse carries one clean unit with one Markdown file below the
// code roots, so the lesson walk meets a code path.
func notesCourse() fstest.MapFS {
	content := fstest.MapFS{}
	content["alpha/learning/code/ex-01-hello/run.yaml"] = &fstest.MapFile{Data: []byte(validRunSpec)}
	content["alpha/learning/code/ex-01-hello/example.py"] = &fstest.MapFile{Data: []byte("print('hello')\n")}
	content["alpha/learning/code/ex-01-hello/expected/main.stdout.txt"] = &fstest.MapFile{Data: []byte("hello\n")}
	content["alpha/learning/code/notes.md"] = &fstest.MapFile{Data: []byte("# notes\n")}
	return content
}

// staleLessonCourse carries one lesson behind its code file, so a
// write-enabled sync has updates to place.
func staleLessonCourse() fstest.MapFS {
	content := fstest.MapFS{}
	content["alpha/learning/lessons/a.md"] = &fstest.MapFile{Data: []byte("# A\n\n**`learning/code/ex-01-a/example.py`**\n\n```python\nprint(\"stale\")\n```\n")}
	content["alpha/learning/code/ex-01-a/example.py"] = &fstest.MapFile{Data: []byte("print(1)\n")}
	return content
}

// unknownFieldSpec carries a run field no schema defines, so the typed
// decode reports it.
func unknownFieldSpec() string {
	return strings.Replace(validRunSpec, "toolchain: python", "toolchain: python\nunknown-field: true", 1)
}

// duplicateKeySpec repeats one mapping key, so the typed decode reports
// the duplicate.
func duplicateKeySpec() string {
	return validRunSpec + "toolchain: python\n"
}

// duplicateRunSpec names two runs alike, so the duplicate run detection
// reports the second.
func duplicateRunSpec() string {
	return `schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, example.py]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
  - name: main
    command: [python3, example.py]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
`
}

// specCourse carries one unit with the given run spec, keeping the code
// and expectation the valid run needs.
func specCourse(spec string) fstest.MapFS {
	content := fstest.MapFS{}
	content["demo/learning/code/ex-01-hello/run.yaml"] = &fstest.MapFile{Data: []byte(spec)}
	content["demo/learning/code/ex-01-hello/example.py"] = &fstest.MapFile{Data: []byte("print('hello')\n")}
	content["demo/learning/code/ex-01-hello/expected/main.stdout.txt"] = &fstest.MapFile{Data: []byte("hello\n")}
	return content
}

// TestCheckCountsListingsForSecondPass requires the repeated opted-in
// listing to surface its failure instead of an empty selection.
func TestCheckCountsListingsForSecondPass(t *testing.T) {
	content := &countFS{inner: fstest.MapFS{}, failListOn: 2}
	_, err := application.Check(context.Background(), application.CheckRequest{
		Content: content,
		Catalog: testCatalog(),
		All:     true,
		Runtime: okStub(),
		RunID:   "test-relist-1",
	})
	if err == nil || !strings.Contains(err.Error(), "list courses") {
		t.Fatalf("Check=%v, want the listing failure", err)
	}
}

// TestCheckCountsListingsForCoverage requires the static coverage listing
// to surface its failure from the inert path.
func TestCheckCountsListingsForCoverage(t *testing.T) {
	content := &countFS{inner: quietCourse(), failListOn: 3}
	_, err := application.Check(context.Background(), application.CheckRequest{
		Content: content,
		Catalog: testCatalog(),
		All:     true,
		Runtime: okStub(),
		RunID:   "test-relist-2",
	})
	if err == nil || !strings.Contains(err.Error(), "list courses") {
		t.Fatalf("Check=%v, want the listing failure", err)
	}
}

// TestCheckCountsListingsForStatic requires the third opted-in listing to
// surface its failure when static courses resolve.
func TestCheckCountsListingsForStatic(t *testing.T) {
	content := &countFS{inner: checkContent(), failListOn: 3}
	_, err := application.Check(context.Background(), application.CheckRequest{
		Content: content,
		Catalog: testCatalog(),
		All:     true,
		Runtime: okStub(),
		RunID:   "test-relist-3",
	})
	if err == nil || !strings.Contains(err.Error(), "list courses") {
		t.Fatalf("Check=%v, want the listing failure", err)
	}
}

// TestCheckCountsSubtreesForValidate requires the validation subtree to
// surface its failure before sync reads the same course.
func TestCheckCountsSubtreesForValidate(t *testing.T) {
	content := &countFS{inner: checkContent(), failSubOn: map[string]int{"demo": 1}}
	_, err := application.Check(context.Background(), application.CheckRequest{
		Content: content,
		Catalog: testCatalog(),
		Courses: []string{"demo"},
		Runtime: okStub(),
		RunID:   "test-resub-0",
	})
	if err == nil || !strings.Contains(err.Error(), `open course "demo"`) {
		t.Fatalf("Check=%v, want the open course failure", err)
	}
}

// TestCheckCountsSubtreesForSync requires the sync subtree to surface its
// failure after validation read the same course.
func TestCheckCountsSubtreesForSync(t *testing.T) {
	content := &countFS{inner: checkContent(), failSubOn: map[string]int{"demo": 2}}
	_, err := application.Check(context.Background(), application.CheckRequest{
		Content: content,
		Catalog: testCatalog(),
		Courses: []string{"demo"},
		Runtime: okStub(),
		RunID:   "test-resub-1",
	})
	if err == nil || !strings.Contains(err.Error(), `open course "demo"`) {
		t.Fatalf("Check=%v, want the open course failure", err)
	}
}

// TestCheckCountsSubtreesForCheckCoverage requires the check coverage
// subtree to surface its failure after validation and sync read it.
func TestCheckCountsSubtreesForCheckCoverage(t *testing.T) {
	content := &countFS{inner: quietCourse(), failSubOn: map[string]int{"quiet": 4}}
	_, err := application.Check(context.Background(), application.CheckRequest{
		Content: content,
		Catalog: testCatalog(),
		All:     true,
		Runtime: okStub(),
		RunID:   "test-resub-2",
	})
	if err == nil || !strings.Contains(err.Error(), `open course "quiet"`) {
		t.Fatalf("Check=%v, want the open course failure", err)
	}
}

// TestCoverageCountsSubtreesForValidate requires the validation subtree
// to surface its failure before sync reads the same course.
func TestCoverageCountsSubtreesForValidate(t *testing.T) {
	content := &countFS{inner: checkContent(), failSubOn: map[string]int{"demo": 1}}
	_, err := application.Coverage(application.CoverageRequest{
		Content: content,
		Catalog: testCatalog(),
		Courses: []string{"demo"},
	})
	if err == nil || !strings.Contains(err.Error(), `open course "demo"`) {
		t.Fatalf("Coverage=%v, want the open course failure", err)
	}
}

// TestCoverageCountsSubtreesForSync requires the sync subtree to surface
// its failure after validation read the same course.
func TestCoverageCountsSubtreesForSync(t *testing.T) {
	content := &countFS{inner: checkContent(), failSubOn: map[string]int{"demo": 2}}
	_, err := application.Coverage(application.CoverageRequest{
		Content: content,
		Catalog: testCatalog(),
		Courses: []string{"demo"},
	})
	if err == nil || !strings.Contains(err.Error(), `open course "demo"`) {
		t.Fatalf("Coverage=%v, want the open course failure", err)
	}
}

// TestCoverageCountsSubtreesForAssess requires the assess subtree to
// surface its failure after validation and sync read the same course.
func TestCoverageCountsSubtreesForAssess(t *testing.T) {
	content := &countFS{inner: checkContent(), failSubOn: map[string]int{"demo": 3}}
	_, err := application.Coverage(application.CoverageRequest{
		Content: content,
		Catalog: testCatalog(),
		Courses: []string{"demo"},
	})
	if err == nil || !strings.Contains(err.Error(), `open course "demo"`) {
		t.Fatalf("Coverage=%v, want the open course failure", err)
	}
}

// TestRunReportsUnreadableExpectedFile requires an expected-output file
// that fails to read to stop the run with the read failure.
func TestRunReportsUnreadableExpectedFile(t *testing.T) {
	content := failFS{
		inner:    stderrExpectCourse(),
		failOpen: map[string]bool{"demo/learning/code/ex-01-hello/expected/main.stderr.txt": true},
	}
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	_, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err == nil || !strings.Contains(err.Error(), "read expected file") {
		t.Fatalf("Run=%v, want the expected file failure", err)
	}
}

// TestRunRecordsMissingExpectedFile requires --record to name the
// recorded file in its finding. The write root is a fixed scratch path
// the production code creates, so the test performs no filesystem call.
func TestRunRecordsMissingExpectedFile(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(recordCourse(), fake)
	req.Record = true
	req.ContentDir = "/tmp/ayokoding-unit-record"
	report, err := application.Run(context.Background(), req)
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, application.CodeStdoutMismatch, "recorded missing", "main.stdout.txt")
}

// TestRunRecordFailsClosedOnUnwritableRoot requires --record below a
// character device to fail naming the expected file.
func TestRunRecordFailsClosedOnUnwritableRoot(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(recordCourse(), fake)
	req.Record = true
	req.ContentDir = "/dev/null/ayokoding-nope"
	_, err := application.Run(context.Background(), req)
	if err == nil || !strings.Contains(err.Error(), "record expected file") {
		t.Fatalf("Run=%v, want the record failure", err)
	}
}

// TestSyncWriteFailsClosedOnMissingDisk requires a write-enabled sync
// against a missing disk tree to fail naming the course. The content
// lives in memory while the write root names scratch the production code
// creates, so the test performs no filesystem call.
func TestSyncWriteFailsClosedOnMissingDisk(t *testing.T) {
	findings, err := application.Sync(application.SyncRequest{
		Content:    staleLessonCourse(),
		ContentDir: "/tmp/ayokoding-unit-sync",
		Courses:    []string{"alpha"},
		Write:      true,
	})
	if err == nil || !strings.Contains(err.Error(), "write lessons for course") {
		t.Fatalf("Sync=%v findings=%v, want the write failure", err, findings)
	}
}

// TestCoverageSkipsCodeNotes requires Markdown below the code roots to
// stay out of the lesson fence counts.
func TestCoverageSkipsCodeNotes(t *testing.T) {
	report, err := application.Coverage(application.CoverageRequest{
		Content: notesCourse(),
		Catalog: testCatalog(),
		Courses: []string{"alpha"},
	})
	if err != nil {
		t.Fatalf("Coverage=%v, want nil", err)
	}
	if len(report.Report.Courses) != 1 {
		t.Fatalf("courses=%+v, want alpha", report.Report.Courses)
	}
}

// TestCatalogDecodeMapsKnownFieldsFailure requires an unknown catalog
// field to report the unknown key code.
func TestCatalogDecodeMapsKnownFieldsFailure(t *testing.T) {
	data := "schema: ayokoding.catalog/v1\nunknown-field: true\n"
	_, err := catalog.Validated([]byte(data))
	if err == nil || !strings.Contains(err.Error(), "unknown key") {
		t.Fatalf("Validated=%v, want the unknown key failure", err)
	}
}

// TestCatalogDecodeMapsDuplicateKey requires a repeated catalog key to
// report the duplicate key code.
func TestCatalogDecodeMapsDuplicateKey(t *testing.T) {
	data := "schema: ayokoding.catalog/v1\nschema: ayokoding.catalog/v1\n"
	_, err := catalog.Validated([]byte(data))
	if err == nil || !strings.Contains(err.Error(), "duplicate key") {
		t.Fatalf("Validated=%v, want the duplicate key failure", err)
	}
}

// TestCatalogDecodeFailsClosedOnGarbage requires undecodable catalog
// bytes to fail with the invalid type code.
func TestCatalogDecodeFailsClosedOnGarbage(t *testing.T) {
	_, err := catalog.Validated([]byte("[unclosed\n"))
	if err == nil || !strings.Contains(err.Error(), "invalid-type") {
		t.Fatalf("Validated=%v, want the invalid type failure", err)
	}
}

// TestCatalogDecodeProbesFallbackLines requires entries with missing and
// empty keys to report their findings, exercising the line fallbacks.
func TestCatalogDecodeProbesFallbackLines(t *testing.T) {
	for _, data := range []string{
		"schema: ayokoding.catalog/v1\ntoolchains:\n  - kind: language\n",
		"schema: ayokoding.catalog/v1\ntoolchains:\n  - {}\n",
	} {
		_, err := catalog.Validated([]byte(data))
		if err == nil {
			t.Fatalf("Validated=nil for %q, want findings", data)
		}
	}
}

// TestValidateReportsWrongTypeRunField requires a run spec with a mistyped
// field to report the invalid type finding.
func TestValidateReportsWrongTypeRunField(t *testing.T) {
	spec := strings.Replace(validRunSpec, "exit: 0", "exit: zero", 1)
	findings, err := application.Validate(application.ValidateRequest{
		Content: specCourse(spec),
		Catalog: testCatalog(),
		Courses: []string{"demo"},
	})
	if err != nil {
		t.Fatalf("Validate=%v, want nil", err)
	}
	found := false
	for _, finding := range findings {
		if strings.Contains(finding.Code, "invalid-type") {
			found = true
		}
	}
	if !found {
		t.Fatalf("findings=%+v, want the invalid type finding", findings)
	}
}

// TestValidateReportsUnknownRunField requires a run spec with an unknown
// field to report the unknown key finding.
func TestValidateReportsUnknownRunField(t *testing.T) {
	findings, err := application.Validate(application.ValidateRequest{
		Content: specCourse(unknownFieldSpec()),
		Catalog: testCatalog(),
		Courses: []string{"demo"},
	})
	if err != nil {
		t.Fatalf("Validate=%v, want nil", err)
	}
	found := false
	for _, finding := range findings {
		if strings.Contains(finding.Code, "unknown-key") {
			found = true
		}
	}
	if !found {
		t.Fatalf("findings=%+v, want the unknown key finding", findings)
	}
}

// TestValidateReportsDuplicateRunKey requires a run spec repeating a key
// to report the duplicate key finding.
func TestValidateReportsDuplicateRunKey(t *testing.T) {
	findings, err := application.Validate(application.ValidateRequest{
		Content: specCourse(duplicateKeySpec()),
		Catalog: testCatalog(),
		Courses: []string{"demo"},
	})
	if err != nil {
		t.Fatalf("Validate=%v, want nil", err)
	}
	found := false
	for _, finding := range findings {
		if strings.Contains(finding.Code, "duplicate-key") {
			found = true
		}
	}
	if !found {
		t.Fatalf("findings=%+v, want the duplicate key finding", findings)
	}
}

// TestValidateReportsDuplicateRunName requires two runs sharing a name
// to report the duplicate.
func TestValidateReportsDuplicateRunName(t *testing.T) {
	findings, err := application.Validate(application.ValidateRequest{
		Content: specCourse(duplicateRunSpec()),
		Catalog: testCatalog(),
		Courses: []string{"demo"},
	})
	if err != nil {
		t.Fatalf("Validate=%v, want nil", err)
	}
	if len(findings) == 0 {
		t.Fatal("findings empty, want the duplicate run report")
	}
}
