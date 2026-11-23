package content_test

import (
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/content"
)

// TestRewriteLeavesOutOfRangeAnchor requires an anchor range past the
// target end to stay untouched.
func TestRewriteLeavesOutOfRangeAnchor(t *testing.T) {
	lesson := "**`t.py#L1-L99`**\n```py\nold\n```\n"
	out, changed := content.RewriteLesson(lesson, func(string) ([]byte, bool) {
		return []byte("only\n"), true
	})
	if changed || out != lesson {
		t.Fatalf("out=%q changed=%v, want the lesson untouched", out, changed)
	}
}

// TestRewriteKeepsEmptyLesson requires an empty lesson to stay unchanged
// without resolving anything.
func TestRewriteKeepsEmptyLesson(t *testing.T) {
	called := false
	out, changed := content.RewriteLesson("", func(string) ([]byte, bool) {
		called = true
		return []byte("only\n"), true
	})
	if changed || out != "" {
		t.Fatalf("out=%q changed=%v, want the empty lesson kept", out, changed)
	}
	if called {
		t.Fatal("resolve called for the empty lesson, want no resolution")
	}
}

// TestCheckSkipsEmptyLesson requires a lesson without lines to report no
// findings instead of failing the scan.
func TestCheckSkipsEmptyLesson(t *testing.T) {
	fsys := mapCourse(map[string]string{"learning/lessons/blank.md": ""})
	if findings := content.Check(syncCourse, fsys); len(findings) != 0 {
		t.Fatalf("findings=%v, want none for the empty lesson", findings)
	}
}

// TestRewriteKeepsCRLFTarget requires a target with CRLF line endings to
// stay untouched, since the repair only handles LF text.
func TestRewriteKeepsCRLFTarget(t *testing.T) {
	lesson := "**`t.py`**\n```py\none\n```\n"
	out, changed := content.RewriteLesson(lesson, func(string) ([]byte, bool) {
		return []byte("one\r\n"), true
	})
	if changed || out != lesson {
		t.Fatalf("out=%q changed=%v, want the CRLF target untouched", out, changed)
	}
}

// TestRewriteKeepsMatchingFence requires a fence that already matches its
// target to report no change.
func TestRewriteKeepsMatchingFence(t *testing.T) {
	lesson := "**`t.py`**\n```py\none\n```\n"
	out, changed := content.RewriteLesson(lesson, func(string) ([]byte, bool) {
		return []byte("one\n"), true
	})
	if changed || out != lesson {
		t.Fatalf("out=%q changed=%v, want the matching fence kept", out, changed)
	}
}

// TestRewriteRepairsStaleFence requires a fence behind its target to take
// the resolved bytes.
func TestRewriteRepairsStaleFence(t *testing.T) {
	lesson := "**`t.py`**\n```py\nstale\n```\n"
	out, changed := content.RewriteLesson(lesson, func(string) ([]byte, bool) {
		return []byte("fresh\n"), true
	})
	if !changed {
		t.Fatalf("changed=%v, want the stale fence repaired (out=%q)", changed, out)
	}
	if !strings.Contains(out, "fresh") || strings.Contains(out, "stale") {
		t.Fatalf("out=%q, want the resolved bytes", out)
	}
}

// TestWriteLessonRefusesBadName requires an absolute or escaping lesson
// name to fail closed without touching the filesystem.
func TestWriteLessonRefusesBadName(t *testing.T) {
	for _, name := range []string{"", "/abs.md", "a/../b.md"} {
		err := content.WriteUpdates("no-such-course-ayokoding", map[string][]byte{name: []byte("fresh\n")})
		if err == nil || !strings.Contains(err.Error(), "not writable") {
			t.Fatalf("WriteUpdates(%q)=%v, want the refusal", name, err)
		}
	}
}

// TestWriteLessonRefusesMissingCourse requires a repair below a missing
// course directory to fail naming the lesson.
func TestWriteLessonRefusesMissingCourse(t *testing.T) {
	err := content.WriteUpdates("no-such-course-ayokoding", map[string][]byte{"learning/lessons/missing.md": []byte("fresh\n")})
	if err == nil || !strings.Contains(err.Error(), "write lesson") {
		t.Fatalf("WriteUpdates=%v, want the write failure", err)
	}
}

// TestWriteLessonRefusesFolder requires a repair naming a folder to fail
// closed: the package directory itself is a folder, so no fixture is
// created.
func TestWriteLessonRefusesFolder(t *testing.T) {
	err := content.WriteUpdates(".", map[string][]byte{".": []byte("fresh\n")})
	if err == nil || !strings.Contains(err.Error(), "not writable") {
		t.Fatalf("WriteUpdates=%v, want the refusal", err)
	}
}
