package content_test

import (
	"io/fs"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/content"
)

// TestCheckIgnoresUnreadableLessons requires an empty lesson and a lesson
// path that is a directory to report nothing instead of failing.
func TestCheckIgnoresUnreadableLessons(t *testing.T) {
	fsys := fstest.MapFS{
		"learning/lessons/empty.md": &fstest.MapFile{Data: []byte{}},
		"learning/lessons/dir.md":   &fstest.MapFile{Mode: fs.ModeDir | 0o755},
	}
	if findings := content.Check(syncCourse, fsys); len(findings) != 0 {
		t.Fatalf("findings=%+v, want none", findings)
	}
}

// TestCheckFlagsFolderTarget requires an anchor to a directory to name the
// missing file.
func TestCheckFlagsFolderTarget(t *testing.T) {
	fsys := mapCourse(map[string]string{
		"learning/lessons/folder.md": "# Folder\n\n**`learning/code/ex-01-hello`**\n\n```python\nprint(\"hello\")\n```\n",
	})
	fsys["learning/code/ex-01-hello"] = &fstest.MapFile{Mode: fs.ModeDir | 0o755}
	findings := content.Check(syncCourse, fsys)
	requireCodes(t, findings, content.CodeMissingFile)
}

// TestCheckToleratesFenceShapes requires short, tilde, and unclosed fences
// to parse without findings when they need no anchor.
func TestCheckToleratesFenceShapes(t *testing.T) {
	fsys := mapCourse(map[string]string{
		"learning/lessons/shapes.md": "# Shapes\n\n``\nnot a fence\n``\n\n```text\ntilde block\n```\n",
	})
	if findings := content.Check(syncCourse, fsys); len(findings) != 0 {
		t.Fatalf("findings=%+v, want none", findings)
	}
}

// TestWriteLessonRefusesBadNames requires unwritable names to fail before
// any file is touched.
func TestWriteLessonRefusesBadNames(t *testing.T) {
	for _, name := range []string{"", "/abs/path.md", "a/../b.md"} {
		if err := content.WriteUpdates("course", map[string][]byte{name: []byte("x")}); err == nil {
			t.Fatalf("WriteUpdates(%q)=nil, want refusal", name)
		}
	}
	if err := content.WriteUpdates("course", map[string][]byte{}); err != nil {
		t.Fatalf("WriteUpdates(empty)=%v, want nil", err)
	}
}
