package application_test

import (
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// syncAlpha is a clean course: the anchored fence holds the file bytes.
func syncAlpha() fstest.MapFS {
	return fstest.MapFS{
		"alpha/learning/code/ex-01-a/run.yaml":   {Data: []byte(validRunSpec)},
		"alpha/learning/code/ex-01-a/example.py": {Data: []byte("print(1)\n")},
		"alpha/learning/lessons/a.md":            {Data: []byte("# A\n\n**`learning/code/ex-01-a/example.py`**\n\n```python\nprint(1)\n```\n")},
		"beta/learning/code/ex-01-b/run.yaml":    {Data: []byte(validRunSpec)},
		"beta/learning/code/ex-01-b/example.py":  {Data: []byte("print(\"one\")\nprint(\"two\")\n")},
		"beta/learning/lessons/b.md":             {Data: []byte("# B\n\n**`learning/code/ex-01-b/example.py`**\n\n```python\nprint(\"stale\")\n```\n\n**`learning/code/ex-09-gone/example.py`**\n\n```python\nprint(\"gone\")\n```\n")},
		"gamma/learning/code/ex-01-g/main.py":    {Data: []byte("print(1)\n")},
		"gamma/learning/lessons/g.md":            {Data: []byte("# G\n")},
	}
}

// TestSyncCleanCourseRequiresNoFindings checks a course whose fences match
// their files.
func TestSyncCleanCourseRequiresNoFindings(t *testing.T) {
	findings, err := application.Sync(application.SyncRequest{
		Content: syncAlpha(),
		Courses: []string{"alpha"},
	})
	if err != nil {
		t.Fatalf("Sync=%v, want nil", err)
	}
	if len(findings) != 0 {
		t.Fatalf("findings=%+v, want none", findings)
	}
}

// TestSyncReportsStaleAndMissingFiles requires a stale fence and a missing
// target to report mismatch and missing-file on their anchor lines.
func TestSyncReportsStaleAndMissingFiles(t *testing.T) {
	findings, err := application.Sync(application.SyncRequest{
		Content: syncAlpha(),
		Courses: []string{"beta"},
	})
	if err != nil {
		t.Fatalf("Sync=%v, want nil", err)
	}
	codes := map[string]int{}
	for _, found := range findings {
		codes[found.Code]++
		if found.Course != "beta" {
			t.Fatalf("finding=%+v, want course beta", found)
		}
	}
	if len(findings) != 2 || codes["ayokoding.sync.mismatch"] != 1 || codes["ayokoding.sync.missing-file"] != 1 {
		t.Fatalf("findings=%+v, want one mismatch and one missing-file", findings)
	}
	if findings[0].Line != 3 || findings[1].Line != 9 {
		t.Fatalf("findings=%+v, want anchor lines 3 and 9", findings)
	}
}

// TestSyncRejectsUnknownCourse requires a named course that does not exist
// to be a usage error.
func TestSyncRejectsUnknownCourse(t *testing.T) {
	_, err := application.Sync(application.SyncRequest{
		Content: syncAlpha(),
		Courses: []string{"zeta"},
	})
	if err == nil {
		t.Fatal("Sync succeeded, want invalid-arguments")
	}
	coded, ok := errors.AsType[*finding.Error](err)
	if !ok {
		t.Fatalf("error=%T, want *finding.Error", err)
	}
	if coded.Code != finding.UsageInvalidArguments {
		t.Fatalf("code=%q, want invalid-arguments", coded.Code)
	}
}

// TestSyncDefaultsToOptedIn requires the default selection to skip inert
// courses without reporting them.
func TestSyncDefaultsToOptedIn(t *testing.T) {
	findings, err := application.Sync(application.SyncRequest{Content: syncAlpha()})
	if err != nil {
		t.Fatalf("Sync=%v, want nil", err)
	}
	for _, found := range findings {
		if found.Course == "gamma" {
			t.Fatalf("findings=%+v, inert gamma must be skipped", findings)
		}
	}
	if len(findings) == 0 {
		t.Fatal("findings empty, want beta findings")
	}
}

// TestSyncIncludesInert requires --include-inert to cover every course,
// including the inert one.
func TestSyncIncludesInert(t *testing.T) {
	findings, err := application.Sync(application.SyncRequest{
		Content:      syncAlpha(),
		IncludeInert: true,
	})
	if err != nil {
		t.Fatalf("Sync=%v, want nil", err)
	}
	if len(findings) == 0 {
		t.Fatal("findings empty, want beta findings")
	}
}

// TestSyncSortsFindings requires deterministic finding order across courses.
func TestSyncSortsFindings(t *testing.T) {
	findings, err := application.Sync(application.SyncRequest{
		Content:      syncAlpha(),
		IncludeInert: true,
	})
	if err != nil {
		t.Fatalf("Sync=%v, want nil", err)
	}
	if len(findings) < 2 {
		t.Fatalf("findings=%+v, want at least two", findings)
	}
	for i := 1; i < len(findings); i++ {
		prev, next := findings[i-1], findings[i]
		if prev.Course > next.Course || (prev.Course == next.Course && prev.Line > next.Line) {
			t.Fatalf("findings out of order: %+v after %+v", next, prev)
		}
	}
}

// writeSyncCourse materializes one MapFS course below a temporary content
// root and returns the root.
func writeSyncCourse(t *testing.T, files fstest.MapFS, course string) string {
	t.Helper()
	root := t.TempDir()
	for route, file := range files {
		if !strings.HasPrefix(route, course+"/") {
			continue
		}
		target := filepath.Join(root, filepath.FromSlash(route))
		if err := os.MkdirAll(filepath.Dir(target), 0o750); err != nil {
			t.Fatalf("create course dir: %v", err)
		}
		if err := os.WriteFile(target, file.Data, 0o600); err != nil {
			t.Fatalf("write course file: %v", err)
		}
	}
	return root
}

// TestSyncWriteRepairsAnchoredFences requires --write to copy file bytes
// into stale fences and report no finding afterwards, and a second write to
// change nothing.
func TestSyncWriteRepairsAnchoredFences(t *testing.T) {
	root := writeSyncCourse(t, syncAlpha(), "beta")
	lesson := filepath.Join(root, "beta", "learning", "lessons", "b.md")
	before, err := os.ReadFile(lesson)
	if err != nil {
		t.Fatalf("read lesson: %v", err)
	}
	findings, err := application.Sync(application.SyncRequest{
		Content:    os.DirFS(root),
		ContentDir: root,
		Courses:    []string{"beta"},
		Write:      true,
	})
	if err != nil {
		t.Fatalf("Sync=%v, want nil", err)
	}
	if len(findings) != 1 || findings[0].Code != "ayokoding.sync.missing-file" {
		t.Fatalf("findings=%+v, want only the missing-file that repair cannot fix", findings)
	}
	after, err := os.ReadFile(lesson)
	if err != nil {
		t.Fatalf("read repaired lesson: %v", err)
	}
	if !strings.Contains(string(after), "print(\"one\")\nprint(\"two\")\n") {
		t.Fatalf("lesson missing repaired bytes:\n%s", after)
	}
	if strings.Contains(string(after), "print(\"stale\")") {
		t.Fatalf("lesson keeps stale bytes:\n%s", after)
	}
	again, err := application.Sync(application.SyncRequest{
		Content:    os.DirFS(root),
		ContentDir: root,
		Courses:    []string{"beta"},
		Write:      true,
	})
	if err != nil {
		t.Fatalf("second Sync=%v, want nil", err)
	}
	if len(again) != 1 {
		t.Fatalf("second findings=%+v, want only the missing-file", again)
	}
	stable, err := os.ReadFile(lesson)
	if err != nil {
		t.Fatalf("read stable lesson: %v", err)
	}
	if string(stable) != string(after) {
		t.Fatalf("second write changed the lesson:\n%s\n%s", after, stable)
	}
	if string(before) == string(after) {
		t.Fatal("write changed nothing, want a repair")
	}
}

// TestSyncWriteNeedsContentDirectory requires --write with repairs but no
// content directory to be a usage error.
func TestSyncWriteNeedsContentDirectory(t *testing.T) {
	_, err := application.Sync(application.SyncRequest{
		Content: syncAlpha(),
		Courses: []string{"beta"},
		Write:   true,
	})
	if err == nil {
		t.Fatal("Sync succeeded, want invalid-arguments")
	}
	coded, ok := errors.AsType[*finding.Error](err)
	if !ok {
		t.Fatalf("error=%T, want *finding.Error", err)
	}
	if coded.Code != finding.UsageInvalidArguments {
		t.Fatalf("code=%q, want invalid-arguments", coded.Code)
	}
}

// TestSyncWriteReportsUnwritableLessons requires a repair the disk refuses
// to surface as a wrapped failure.
func TestSyncWriteReportsUnwritableLessons(t *testing.T) {
	root := t.TempDir()
	_, err := application.Sync(application.SyncRequest{
		Content:    syncAlpha(),
		ContentDir: root,
		Courses:    []string{"beta"},
		Write:      true,
	})
	if err == nil {
		t.Fatal("Sync succeeded, want a write failure")
	}
	if _, ok := errors.AsType[*finding.Error](err); ok {
		t.Fatalf("error=%v, want a wrapped failure, not a coded one", err)
	}
}

// errNoSubtrees stands in for an unreadable course directory.
var errNoSubtrees = errors.New("sync test: no subtrees")

// subFailFS hides course subtrees: selection by directory entry still works,
// but opening one course fails.
type subFailFS struct {
	fstest.MapFS
}

// Sub always fails, standing in for an unreadable course directory.
func (subFailFS) Sub(_ string) (fs.FS, error) {
	return nil, errNoSubtrees
}

// TestSyncReportsUnreadableCourse requires a course that cannot open to be
// a wrapped failure.
func TestSyncReportsUnreadableCourse(t *testing.T) {
	content := subFailFS{syncAlpha()}
	_, err := application.Sync(application.SyncRequest{
		Content: content,
		Courses: []string{"beta"},
	})
	if err == nil {
		t.Fatal("Sync succeeded, want an open failure")
	}
	if _, ok := errors.AsType[*finding.Error](err); ok {
		t.Fatalf("error=%v, want a wrapped failure, not a coded one", err)
	}
}
