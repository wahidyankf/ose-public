package layout_test

import (
	"errors"
	"fmt"
	"io/fs"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/layout"
)

// errBoomLayout fails the selected layout reads.
var errBoomLayout = errors.New("boom")

// failFS fails opens of the named course-relative paths.
type failFS struct {
	inner    fstest.MapFS
	failOpen map[string]bool
}

func (f failFS) Open(name string) (fs.File, error) {
	if f.failOpen[name] {
		return nil, errBoomLayout
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
	entries, err := fs.ReadDir(f.inner, name)
	if err != nil {
		return nil, fmt.Errorf("test: read dir %s: %w", name, err)
	}
	return entries, nil
}

// TestIsApplicableReportsUnreadableLessons requires a lesson that
// cannot be read to stay out of the applicability check.
func TestIsApplicableReportsUnreadableLessons(t *testing.T) {
	inner := fstest.MapFS{
		"learning/lesson.md": &fstest.MapFile{Data: []byte("```py\ncode\n```\n")},
	}
	if layout.IsApplicable(inner) != true {
		t.Fatal("IsApplicable=false, want true for the fenced lesson")
	}
	broken := failFS{inner: inner, failOpen: map[string]bool{"learning/lesson.md": true}}
	if layout.IsApplicable(broken) != false {
		t.Fatal("IsApplicable=true, want false for the unreadable lesson")
	}
}

// TestDiscoverReportsCapstoneUnit requires a capstone code folder to
// register the capstone unit.
func TestDiscoverReportsCapstoneUnit(t *testing.T) {
	content := fstest.MapFS{
		"learning/capstone/code": &fstest.MapFile{Mode: fs.ModeDir},
	}
	units, _ := layout.Discover("demo", content)
	if len(units) != 1 || units[0].Path != "learning/capstone/code" {
		t.Fatalf("units=%v, want the capstone unit", units)
	}
}

// TestDiscoverReportsMisplacedSpecSeam requires a run spec outside a
// unit folder to fail placement with its path.
func TestDiscoverReportsMisplacedSpecSeam(t *testing.T) {
	content := fstest.MapFS{
		"learning/run.yaml":               &fstest.MapFile{Data: []byte("schema: x\n")},
		"learning/code/ex-01-one/main.py": &fstest.MapFile{Data: []byte("print(1)\n")},
	}
	units, findings := layout.Discover("demo", content)
	if len(units) != 1 || units[0].Path != "learning/code/ex-01-one" {
		t.Fatalf("units=%v, want the bare unit folder", units)
	}
	if len(findings) != 1 || findings[0].Path != "learning/run.yaml" {
		t.Fatalf("findings=%v, want the misplaced spec", findings)
	}
}
