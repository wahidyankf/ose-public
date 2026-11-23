package content_test

import (
	"errors"
	"fmt"
	"io/fs"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/content"
)

// errBoomContent fails the selected content reads.
var errBoomContent = errors.New("boom")

// failCourse fails opens of the named course-relative paths and stats
// through the inner tree, so the check reaches the read it guards.
type failCourse struct {
	inner    fstest.MapFS
	failOpen map[string]bool
}

func (f failCourse) Open(name string) (fs.File, error) {
	if f.failOpen[name] {
		return nil, errBoomContent
	}
	opened, err := f.inner.Open(name)
	if err != nil {
		return nil, fmt.Errorf("test: open %s: %w", name, err)
	}
	return opened, nil
}

func (f failCourse) Stat(name string) (fs.FileInfo, error) {
	info, err := fs.Stat(f.inner, name)
	if err != nil {
		return nil, fmt.Errorf("test: stat %s: %w", name, err)
	}
	return info, nil
}

func (f failCourse) ReadDir(name string) ([]fs.DirEntry, error) {
	entries, err := fs.ReadDir(f.inner, name)
	if err != nil {
		return nil, fmt.Errorf("test: read dir %s: %w", name, err)
	}
	return entries, nil
}

// TestCheckSortsSameLineFindings requires two units with no anchors to
// order their findings deterministically.
func TestCheckSortsSameLineFindings(t *testing.T) {
	fsys := mapCourse(map[string]string{
		"learning/code/ex-01-one/run.yaml": "schema: x\n",
		"learning/code/ex-02-two/run.yaml": "schema: x\n",
	})
	findings := content.Check(syncCourse, fsys)
	if len(findings) != 2 {
		t.Fatalf("findings=%v, want the two unreferenced units", findings)
	}
	for _, found := range findings {
		if found.Line != 0 || found.Code != content.CodeUnreferencedUnit {
			t.Fatalf("finding=%+v, want line-0 unreferenced units", found)
		}
	}
}

// TestCheckReadsFenceAtFileStart requires a lesson that opens with a
// fence to report it unanchored.
func TestCheckReadsFenceAtFileStart(t *testing.T) {
	fsys := mapCourse(map[string]string{
		"learning/lessons/top.md": "```py\ncode\n```\n",
	})
	findings := content.Check(syncCourse, fsys)
	if len(findings) != 1 || findings[0].Code != content.CodeUnanchoredFence {
		t.Fatalf("findings=%v, want one unanchored fence", findings)
	}
}

// TestCheckSkipsShadowedFence requires an anchor whose fence sits inside
// an earlier span to report no fence on its line.
func TestCheckSkipsShadowedFence(t *testing.T) {
	fsys := mapCourse(map[string]string{
		"learning/code/t.py": "one\n",
		"learning/lessons/s.md": "**`learning/code/t.py`**\n```py\n" +
			"**`learning/code/t.py`**\n```py\none\n```\n",
	})
	findings := content.Check(syncCourse, fsys)
	found := false
	for _, finding := range findings {
		if finding.Code == content.CodeAnchorWithoutFence && finding.Line == 3 {
			found = true
		}
	}
	if !found {
		t.Fatalf("findings=%v, want the shadowed anchor without a fence", findings)
	}
}

// TestCheckToleratesStrayFenceSyntax requires a short fence run to stay
// out of the fence spans.
func TestCheckToleratesStrayFenceSyntax(t *testing.T) {
	fsys := mapCourse(map[string]string{
		"learning/code/t.py":    "one\n",
		"learning/lessons/s.md": "# Title\n\n``x\n\n**`learning/code/t.py`**\n```py\none\n```\n",
	})
	if findings := content.Check(syncCourse, fsys); len(findings) != 0 {
		t.Fatalf("findings=%v, want none", findings)
	}
}

// TestCheckComparesAgainstEmptyTarget requires a blank fence body over
// an empty target to report the trailing line.
func TestCheckComparesAgainstEmptyTarget(t *testing.T) {
	fsys := mapCourse(map[string]string{
		"learning/code/empty.py": "",
		"learning/lessons/e.md":  "**`learning/code/empty.py`**\n```py\n\n```\n",
	})
	findings := content.Check(syncCourse, fsys)
	if len(findings) != 1 || findings[0].Code != content.CodeMismatch {
		t.Fatalf("findings=%v, want one mismatch", findings)
	}
}

// TestCheckSkipsUnreadableLesson requires a lesson that cannot be read
// to stay out of the report.
func TestCheckSkipsUnreadableLesson(t *testing.T) {
	inner := mapCourse(map[string]string{
		"learning/lessons/locked.md": "**`learning/code/t.py`**\n```py\none\n```\n",
		"learning/code/t.py":         "one\n",
	})
	fsys := failCourse{inner: inner, failOpen: map[string]bool{"learning/lessons/locked.md": true}}
	if findings := content.Check(syncCourse, fsys); len(findings) != 0 {
		t.Fatalf("findings=%v, want none", findings)
	}
}

// TestCheckReadsTargetDespiteStat requires a target that stats but
// does not read to fail the anchor.
func TestCheckReadsTargetDespiteStat(t *testing.T) {
	inner := mapCourse(map[string]string{
		"learning/lessons/locked.md": "**`learning/code/t.py`**\n```py\none\n```\n",
		"learning/code/t.py":         "one\n",
	})
	fsys := failCourse{inner: inner, failOpen: map[string]bool{"learning/code/t.py": true}}
	findings := content.Check(syncCourse, fsys)
	if len(findings) != 1 || findings[0].Code != content.CodeMissingFile {
		t.Fatalf("findings=%v, want one missing file", findings)
	}
}

// TestRewriteLeavesFenceAtFileStart requires a fence with no anchor
// above to stay untouched.
func TestRewriteLeavesFenceAtFileStart(t *testing.T) {
	lesson := "```py\ncode\n```\n"
	out, changed := content.RewriteLesson(lesson, func(string) ([]byte, bool) {
		t.Fatal("resolve must not run without an anchor")
		return nil, false
	})
	if changed || out != lesson {
		t.Fatalf("out=%q changed=%v, want the lesson untouched", out, changed)
	}
}

// TestRewriteSkipsAnchorWithoutFence requires an anchor followed by
// prose to stay untouched.
func TestRewriteSkipsAnchorWithoutFence(t *testing.T) {
	lesson := "**`t.py`**\n\nprose\n```py\ncode\n```\n"
	out, changed := content.RewriteLesson(lesson, func(string) ([]byte, bool) {
		return []byte("code\n"), true
	})
	if changed || out != lesson {
		t.Fatalf("out=%q changed=%v, want the lesson untouched", out, changed)
	}
}

// TestRewriteKeepsUnclosedFence requires an unclosed anchored fence to
// grow the body without a closing line.
func TestRewriteKeepsUnclosedFence(t *testing.T) {
	lesson := "**`t.py`**\n```py\nold\n"
	out, changed := content.RewriteLesson(lesson, func(string) ([]byte, bool) {
		return []byte("new\n"), true
	})
	if !changed {
		t.Fatalf("changed=%v, want the body replaced", changed)
	}
	if !strings.Contains(out, "new\n") || strings.Contains(out, "old") {
		t.Fatalf("out=%q, want the new body", out)
	}
}

// TestRewriteRendersEmptyTarget requires an empty target to clear the
// anchored fence body.
func TestRewriteRendersEmptyTarget(t *testing.T) {
	lesson := "**`t.py`**\n```py\nold\n```\n"
	out, changed := content.RewriteLesson(lesson, func(string) ([]byte, bool) {
		return []byte{}, true
	})
	if !changed {
		t.Fatalf("changed=%v, want the body cleared", changed)
	}
	if strings.Contains(out, "old") {
		t.Fatalf("out=%q, want the body gone", out)
	}
}
