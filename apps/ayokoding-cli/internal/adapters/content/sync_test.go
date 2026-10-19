package content_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/content"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

const syncCourse = "demo"

// mapCourse builds an in-memory course from path to body.
func mapCourse(files map[string]string) fstest.MapFS {
	fsys := fstest.MapFS{}
	for name, body := range files {
		fsys[name] = &fstest.MapFile{Data: []byte(body)}
	}
	return fsys
}

// onlyCode returns the findings carrying the code.
func onlyCode(findings []finding.Finding, code string) []finding.Finding {
	var kept []finding.Finding
	for _, found := range findings {
		if found.Code == code {
			kept = append(kept, found)
		}
	}
	return kept
}

// requireCodes fails when the findings carry anything but the codes in
// order.
func requireCodes(t *testing.T, findings []finding.Finding, codes ...string) {
	t.Helper()
	if len(findings) != len(codes) {
		t.Fatalf("codes=%v, want %v (findings=%+v)", findingCodes(findings), codes, findings)
	}
	for index, code := range codes {
		if findings[index].Code != code {
			t.Fatalf("codes=%v, want %v", findingCodes(findings), codes)
		}
	}
}

// findingCodes lists every finding code in order.
func findingCodes(findings []finding.Finding) []string {
	codes := make([]string, 0, len(findings))
	for _, found := range findings {
		codes = append(codes, found.Code)
	}
	return codes
}

// TestCheckMatchingAnchor proves an anchored fence holding its file bytes
// reports nothing.
func TestCheckMatchingAnchor(t *testing.T) {
	fsys := mapCourse(map[string]string{
		"learning/code/ex-01-hello/example.py": "print(\"hello\")\nprint(\"middle\")\nprint(\"world\")\n",
		"learning/lessons/hello.md": "# Hello\n\n" +
			"**`learning/code/ex-01-hello/example.py`**\n\n" +
			"```python\nprint(\"hello\")\nprint(\"middle\")\nprint(\"world\")\n```\n",
	})
	if findings := content.Check(syncCourse, fsys); len(findings) != 0 {
		t.Fatalf("findings=%+v, want none", findings)
	}
}

// TestCheckMismatch proves a differing body names the first differing
// line.
func TestCheckMismatch(t *testing.T) {
	fsys := mapCourse(map[string]string{
		"learning/code/ex-01-hello/example.py": "print(\"hello\")\nprint(\"middle\")\nprint(\"world\")\n",
		"learning/lessons/hello.md": "# Hello\n\n" +
			"**`learning/code/ex-01-hello/example.py`**\n\n" +
			"```python\nprint(\"hello\")\nprint(\"middle\")\nprint(\"CHANGED\")\n```\n",
	})
	findings := content.Check(syncCourse, fsys)
	requireCodes(t, findings, content.CodeMismatch)
	found := findings[0]
	if found.Path != "learning/lessons/hello.md" {
		t.Fatalf("Path=%q, want the lesson file", found.Path)
	}
	if found.Line != 3 {
		t.Fatalf("Line=%d, want the anchor line", found.Line)
	}
	if !strings.Contains(found.Message, "line 3") {
		t.Fatalf("Message=%q, want the first differing body line", found.Message)
	}
}

// findingCase is one sync finding the check must report exactly once.
type findingCase struct {
	name    string
	files   map[string]string
	code    string
	path    string
	message string
}

// runFindingCases proves every case reports exactly its finding.
func runFindingCases(t *testing.T, tests []findingCase) {
	t.Helper()
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			findings := content.Check(syncCourse, mapCourse(test.files))
			matches := onlyCode(findings, test.code)
			if len(matches) != 1 {
				t.Fatalf("codes=%v, want exactly one %s", findingCodes(findings), test.code)
			}
			if matches[0].Path != test.path {
				t.Errorf("Path=%q, want %q", matches[0].Path, test.path)
			}
			if !strings.Contains(matches[0].Message, test.message) {
				t.Errorf("Message=%q, want it to name %q", matches[0].Message, test.message)
			}
		})
	}
}

// rangeLines is a ten-line target for range anchors.
func rangeLines() string {
	return "value01 = 1\nvalue02 = 2\nvalue03 = 3\nvalue04 = 4\nvalue05 = 5\n" +
		"value06 = 6\nvalue07 = 7\nvalue08 = 8\nvalue09 = 9\nvalue10 = 10\n"
}

// TestCheckTargetFindings proves missing files and bad ranges report.
func TestCheckTargetFindings(t *testing.T) {
	runFindingCases(t, []findingCase{
		{
			name: "missing file names its path",
			files: map[string]string{
				"learning/lessons/gone.md": "# Gone\n\n**`learning/code/ex-09-gone/example.py`**\n\n```python\nprint(\"gone\")\n```\n",
			},
			code:    content.CodeMissingFile,
			path:    "learning/lessons/gone.md",
			message: "learning/code/ex-09-gone/example.py",
		},
		{
			name: "malformed range is a bad range",
			files: map[string]string{
				"learning/code/ex-01-hello/example.py": "print(\"hello\")\n",
				"learning/lessons/range.md":            "# Range\n\n**`learning/code/ex-01-hello/example.py#L2`**\n\n```python\nprint(\"hello\")\n```\n",
			},
			code:    content.CodeBadRange,
			path:    "learning/lessons/range.md",
			message: "range",
		},
		{
			name: "reversed range is a bad range",
			files: map[string]string{
				"learning/code/ex-01-hello/example.py": "print(\"hello\")\n",
				"learning/lessons/range.md":            "# Range\n\n**`learning/code/ex-01-hello/example.py#L3-L1`**\n\n```python\nprint(\"hello\")\n```\n",
			},
			code:    content.CodeBadRange,
			path:    "learning/lessons/range.md",
			message: "range",
		},
		{
			name: "range outside the file is a bad range",
			files: map[string]string{
				"learning/code/ex-02-range/lines.py": rangeLines(),
				"learning/lessons/range.md":          "# Range\n\n**`learning/code/ex-02-range/lines.py#L9-L99`**\n\n```python\nvalue09 = 9\n```\n",
			},
			code:    content.CodeBadRange,
			path:    "learning/lessons/range.md",
			message: "range",
		},
	})
}

// TestCheckFenceFindings proves fence attachment findings report.
func TestCheckFenceFindings(t *testing.T) {
	runFindingCases(t, []findingCase{
		{
			name: "anchor without a fence",
			files: map[string]string{
				"learning/code/ex-01-hello/example.py": "print(\"hello\")\n",
				"learning/lessons/lonely.md":           "# Lonely\n\n**`learning/code/ex-01-hello/example.py`**\n\nProse intervenes, so no fence follows.\n",
			},
			code:    content.CodeAnchorWithoutFence,
			path:    "learning/lessons/lonely.md",
			message: "no fence",
		},
		{
			name: "indented anchored fence",
			files: map[string]string{
				"learning/code/ex-01-hello/example.py": "print(\"hello\")\n",
				"learning/lessons/indented.md":         "# Indented\n\n**`learning/code/ex-01-hello/example.py`**\n\n    ```python\n    print(\"hello\")\n    ```\n",
			},
			code:    content.CodeIndentedFence,
			path:    "learning/lessons/indented.md",
			message: "column 0",
		},
		{
			name: "unanchored code fence",
			files: map[string]string{
				"learning/lessons/plain.md": "# Plain\n\n```python\nprint(\"fragment\")\n```\n",
			},
			code:    content.CodeUnanchoredFence,
			path:    "learning/lessons/plain.md",
			message: "illustration",
		},
		{
			name: "bare output block",
			files: map[string]string{
				"learning/lessons/out.md": "# Out\n\n**Output**\n\n```text\nhello\n```\n",
			},
			code:    content.CodeUnanchoredOutput,
			path:    "learning/lessons/out.md",
			message: "expected",
		},
		{
			name: "output anchored to a code file",
			files: map[string]string{
				"learning/code/ex-01-hello/example.py": "print(\"hello\")\n",
				"learning/lessons/out.md":              "# Out\n\n**Output** (`learning/code/ex-01-hello/example.py`)\n\n```python\nprint(\"hello\")\n```\n",
			},
			code:    content.CodeUnanchoredOutput,
			path:    "learning/lessons/out.md",
			message: "expected",
		},
		{
			name: "crlf target",
			files: map[string]string{
				"learning/code/ex-06-crlf/data.py": "print(\"a\")\r\nprint(\"b\")\r\n",
				"learning/lessons/crlf.md":         "# CRLF\n\n**`learning/code/ex-06-crlf/data.py`**\n\n```python\nprint(\"a\")\nprint(\"b\")\n```\n",
			},
			code:    content.CodeCRLF,
			path:    "learning/lessons/crlf.md",
			message: "CRLF",
		},
	})
}

// TestCheckCleanShapes proves the fences the check leaves alone: prose
// fences, illustrations, anchored output, valid ranges, blank-line
// separation, and Markdown inside code folders.
func TestCheckCleanShapes(t *testing.T) {
	tenLines := rangeLines()
	tests := []struct {
		name  string
		files map[string]string
	}{
		{
			name: "prose fences need no anchor",
			files: map[string]string{
				"learning/lessons/prose.md": "# Prose\n\n```text\nany words\n```\n\n```mermaid\nflowchart LR\n```\n\n```markdown\n# nested\n```\n",
			},
		},
		{
			name: "illustration marker suppresses the unanchored fence",
			files: map[string]string{
				"learning/lessons/sketch.md": "# Sketch\n\n<!-- harness: illustration -->\n\n```python\nprint(\"fragment\")\n```\n",
			},
		},
		{
			name: "output anchored to an expected file",
			files: map[string]string{
				"learning/code/ex-01-hello/expected/main.stdout.txt": "hello\n",
				"learning/lessons/out.md": "# Out\n\n" +
					"**Output** (`learning/code/ex-01-hello/expected/main.stdout.txt`):\n\n```text\nhello\n```\n",
			},
		},
		{
			name: "range anchor holding exactly its lines",
			files: map[string]string{
				"learning/code/ex-02-range/lines.py": tenLines,
				"learning/lessons/range.md": "# Range\n\n" +
					"**`learning/code/ex-02-range/lines.py#L3-L5`**\n\n```python\nvalue03 = 3\nvalue04 = 4\nvalue05 = 5\n```\n",
			},
		},
		{
			name: "blank lines between anchor and fence",
			files: map[string]string{
				"learning/code/ex-01-hello/example.py": "print(\"hello\")\n",
				"learning/lessons/spaced.md": "# Spaced\n\n" +
					"**`learning/code/ex-01-hello/example.py`**\n\n\n```python\nprint(\"hello\")\n```\n",
			},
		},
		{
			name: "markdown inside code folders is not a lesson",
			files: map[string]string{
				"learning/code/notes.md": "# Notes\n\n```python\nprint(\"fragment\")\n```\n",
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if findings := content.Check(syncCourse, mapCourse(test.files)); len(findings) != 0 {
				t.Fatalf("findings=%+v, want none", findings)
			}
		})
	}
}

// TestCheckUnreferencedUnit proves a unit no lesson anchor targets is
// reported while referenced units stay silent.
func TestCheckUnreferencedUnit(t *testing.T) {
	fsys := mapCourse(map[string]string{
		"learning/code/ex-01-hello/example.py": "print(\"hello\")\n",
		"learning/code/ex-05-sets/example.py":  "print(\"sets\")\n",
		"learning/lessons/hello.md": "# Hello\n\n" +
			"**`learning/code/ex-01-hello/example.py`**\n\n```python\nprint(\"hello\")\n```\n",
	})
	findings := content.Check(syncCourse, fsys)
	requireCodes(t, findings, content.CodeUnreferencedUnit)
	if findings[0].Path != "learning/code/ex-05-sets" {
		t.Fatalf("Path=%q, want the unreferenced unit", findings[0].Path)
	}
}

// TestRewriteLesson proves the pure rewrite: bodies follow their files,
// ranges follow their lines, fences grow past inner fences, other bytes
// stay identical, and a second rewrite changes nothing.
func TestRewriteLesson(t *testing.T) {
	resolve := func(target string) ([]byte, bool) {
		files := map[string]string{
			"learning/code/ex-01-hello/example.py":  "print(\"hello\")\nprint(\"middle\")\nprint(\"world\")\n",
			"learning/code/ex-02-range/lines.py":    "one\ntwo\nthree\nfour\nfive\n",
			"learning/code/ex-07-nested/example.py": "print(\"outer\")\n```python\nprint(\"inner\")\n```\n",
			"learning/code/ex-08-noeol/example.py":  "print(\"noeol\")",
			"learning/code/ex-06-crlf/data.py":      "print(\"a\")\r\nprint(\"b\")\r\n",
		}
		body, ok := files[target]
		return []byte(body), ok
	}
	t.Run("body follows the file", func(t *testing.T) {
		lesson := "# Hello\n\n**`learning/code/ex-01-hello/example.py`**\n\n```python\nprint(\"stale\")\n```\n"
		want := "# Hello\n\n**`learning/code/ex-01-hello/example.py`**\n\n```python\nprint(\"hello\")\nprint(\"middle\")\nprint(\"world\")\n```\n"
		got, changed := content.RewriteLesson(lesson, resolve)
		if !changed {
			t.Fatal("changed=false, want a repair")
		}
		if got != want {
			t.Fatalf("got %q, want %q", got, want)
		}
		again, changed := content.RewriteLesson(got, resolve)
		if changed || again != want {
			t.Fatalf("second rewrite changed the lesson: %q", again)
		}
	})
	t.Run("range follows its lines", func(t *testing.T) {
		lesson := "# Range\n\n**`learning/code/ex-02-range/lines.py#L2-L3`**\n\n```python\nstale\n```\n"
		want := "# Range\n\n**`learning/code/ex-02-range/lines.py#L2-L3`**\n\n```python\ntwo\nthree\n```\n"
		got, changed := content.RewriteLesson(lesson, resolve)
		if !changed || got != want {
			t.Fatalf("got %q changed=%v, want %q", got, changed, want)
		}
	})
	t.Run("fence grows past an inner fence", func(t *testing.T) {
		lesson := "# Nested\n\n**`learning/code/ex-07-nested/example.py`**\n\n```python\nstale\n```\n"
		got, changed := content.RewriteLesson(lesson, resolve)
		if !changed {
			t.Fatal("changed=false, want a repair")
		}
		if !strings.Contains(got, "````python") {
			t.Fatalf("fence did not lengthen: %q", got)
		}
		again, changed := content.RewriteLesson(got, resolve)
		if changed || again != got {
			t.Fatalf("second rewrite changed the lesson: %q", again)
		}
	})
	t.Run("file without a final line feed", func(t *testing.T) {
		lesson := "# Noeol\n\n**`learning/code/ex-08-noeol/example.py`**\n\n```python\nstale\n```\n"
		want := "# Noeol\n\n**`learning/code/ex-08-noeol/example.py`**\n\n```python\nprint(\"noeol\")\n```\n"
		got, changed := content.RewriteLesson(lesson, resolve)
		if !changed || got != want {
			t.Fatalf("got %q changed=%v, want %q", got, changed, want)
		}
	})
	t.Run("missing crlf and unanchored fences stay untouched", func(t *testing.T) {
		lesson := "# Mixed\n\n**`learning/code/ex-06-crlf/data.py`**\n\n```python\nprint(\"a\")\n```\n\n" +
			"**`learning/code/ex-09-gone/example.py`**\n\n```python\nprint(\"gone\")\n```\n\n" +
			"```python\nprint(\"fragment\")\n```\n"
		got, changed := content.RewriteLesson(lesson, resolve)
		if changed || got != lesson {
			t.Fatalf("rewrite touched an unresolvable fence: %q", got)
		}
	})
}

// TestWriteUpdatesProvesMode proves repairs land on disk with mode 0644,
// even over a lesson that carried a narrower mode.
func TestWriteUpdatesProvesMode(t *testing.T) {
	root := t.TempDir()
	lesson := filepath.Join(root, "learning", "lessons", "hello.md")
	if err := os.MkdirAll(filepath.Dir(lesson), 0o700); err != nil {
		t.Fatalf("create lesson directory: %v", err)
	}
	if err := os.WriteFile(lesson, []byte("stale\n"), 0o600); err != nil {
		t.Fatalf("seed lesson: %v", err)
	}
	updates := map[string][]byte{"learning/lessons/hello.md": []byte("fresh\n")}
	if err := content.WriteUpdates(root, updates); err != nil {
		t.Fatalf("WriteUpdates: %v", err)
	}
	body, err := os.ReadFile(lesson)
	if err != nil {
		t.Fatalf("read lesson: %v", err)
	}
	if string(body) != "fresh\n" {
		t.Fatalf("body=%q, want the repair", body)
	}
	info, err := os.Stat(lesson)
	if err != nil {
		t.Fatalf("stat lesson: %v", err)
	}
	if info.Mode().Perm() != 0o644 {
		t.Fatalf("mode=%o, want 644", info.Mode().Perm())
	}
}

// TestWriteUpdatesRefusesCreation proves the rewrite repairs lessons only:
// it creates no files and leaves unknown lessons alone.
func TestWriteUpdatesRefusesCreation(t *testing.T) {
	root := t.TempDir()
	updates := map[string][]byte{"learning/lessons/missing.md": []byte("fresh\n")}
	if err := content.WriteUpdates(root, updates); err == nil {
		t.Fatal("WriteUpdates created a lesson, want an error")
	}
	if _, err := os.Stat(filepath.Join(root, "learning", "lessons", "missing.md")); !os.IsNotExist(err) {
		t.Fatalf("missing lesson exists after WriteUpdates: %v", err)
	}
}
