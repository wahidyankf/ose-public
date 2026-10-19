package anchors_test

import (
	"reflect"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/anchors"
)

// TestParseLinePathLabel proves the **`path`** form anchors a fence.
func TestParseLinePathLabel(t *testing.T) {
	anchor, ok := anchors.ParseLine("**`learning/code/ex-01-hello/example.py`**", 7)
	if !ok {
		t.Fatal("ParseLine rejected a path label anchor")
	}
	if anchor.Path != "learning/code/ex-01-hello/example.py" {
		t.Fatalf("Path=%q, want the course-relative target", anchor.Path)
	}
	if anchor.Line != 7 {
		t.Fatalf("Line=%d, want 7", anchor.Line)
	}
	if anchor.Labelled || anchor.HasRange || anchor.Malformed {
		t.Fatalf("plain path label carries no label, range, or defect: %+v", anchor)
	}
}

// TestParseLineForms proves every anchor shape in the contract.
func TestParseLineForms(t *testing.T) {
	tests := []struct {
		name     string
		line     string
		path     string
		labelled bool
		label    string
		hasRange bool
		start    int
		end      int
	}{
		{
			name:  "path label with a line range",
			line:  "**`learning/capstone/code/app/server.py#L10-L42`**",
			path:  "learning/capstone/code/app/server.py",
			start: 10, end: 42, hasRange: true,
		},
		{
			name:     "labelled kata path",
			line:     "**Before** (`drilling/code/kata-03-null-checks/before/kata.sql`)",
			path:     "drilling/code/kata-03-null-checks/before/kata.sql",
			labelled: true,
			label:    "Before",
		},
		{
			name:     "labelled output path with a trailing colon",
			line:     "**Output** (`learning/code/ex-01-hello-script/expected/main.stdout.txt`):",
			path:     "learning/code/ex-01-hello-script/expected/main.stdout.txt",
			labelled: true,
			label:    "Output",
		},
		{
			name:     "label with punctuation and a trailing colon",
			line:     "**Step 1: Set-up!** (`learning/code/ex-02-range/lines.py`):",
			path:     "learning/code/ex-02-range/lines.py",
			labelled: true,
			label:    "Step 1: Set-up!",
		},
		{
			name:     "labelled path with a line range",
			line:     "**Excerpt** (`learning/code/ex-02-range/lines.py#L3-L5`)",
			path:     "learning/code/ex-02-range/lines.py",
			labelled: true,
			label:    "Excerpt",
			start:    3, end: 5, hasRange: true,
		},
		{
			name: "path label with a trailing colon",
			line: "**`learning/code/ex-01-hello/example.py`**:",
			path: "learning/code/ex-01-hello/example.py",
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			anchor, ok := anchors.ParseLine(test.line, 1)
			if !ok {
				t.Fatalf("ParseLine rejected %q", test.line)
			}
			if anchor.Path != test.path {
				t.Errorf("Path=%q, want %q", anchor.Path, test.path)
			}
			if anchor.Labelled != test.labelled {
				t.Errorf("Labelled=%v, want %v", anchor.Labelled, test.labelled)
			}
			if anchor.Label != test.label {
				t.Errorf("Label=%q, want %q", anchor.Label, test.label)
			}
			if anchor.HasRange != test.hasRange || anchor.Start != test.start || anchor.End != test.end {
				t.Errorf("range=(%v %d %d), want (%v %d %d)",
					anchor.HasRange, anchor.Start, anchor.End, test.hasRange, test.start, test.end)
			}
			if anchor.Malformed {
				t.Errorf("well-formed anchor %q reports malformed", test.line)
			}
		})
	}
}

// TestParseLineRejectsLookalikes proves bold text without a code span and a
// code span without bold are not anchors.
func TestParseLineRejectsLookalikes(t *testing.T) {
	lines := []string{
		"",
		"plain prose",
		"**bold text without a code span**",
		"`learning/code/ex-01-hello/example.py`",
		"**Before** (learning/code/ex-01-hello/example.py)",
		"**`unclosed span",
		"<!-- harness: illustration -->",
		"```python",
	}
	for _, line := range lines {
		t.Run("line "+line, func(t *testing.T) {
			if anchor, ok := anchors.ParseLine(line, 1); ok {
				t.Fatalf("ParseLine accepted %q as %+v", line, anchor)
			}
		})
	}
}

// TestParseLineMalformedRange proves a range suffix that does not parse is
// still an anchor carrying the defect for the sync check to report.
func TestParseLineMalformedRange(t *testing.T) {
	lines := []string{
		"**`learning/code/ex-01-hello/example.py#L3`**",
		"**`learning/code/ex-01-hello/example.py#Lx-Ly`**",
		"**`learning/code/ex-01-hello/example.py#section`**",
		"**Excerpt** (`learning/code/ex-02-range/lines.py#L3-`)",
	}
	for _, line := range lines {
		t.Run("line "+line, func(t *testing.T) {
			anchor, ok := anchors.ParseLine(line, 1)
			if !ok {
				t.Fatalf("ParseLine rejected malformed anchor %q", line)
			}
			if !anchor.Malformed {
				t.Fatalf("anchor %q carries no defect flag", line)
			}
			if anchor.HasRange {
				t.Fatalf("malformed anchor %q claims a range", line)
			}
		})
	}
}

// TestSelect proves range selection: a valid range selects, while a
// reversed, zero-based, or outside range selects nothing.
func TestSelect(t *testing.T) {
	lines := []string{"one", "two", "three", "four", "five"}
	tests := []struct {
		name  string
		inner string
		want  []string
		ok    bool
	}{
		{name: "whole file without a range", inner: "learning/code/ex-01-hello/example.py", want: lines, ok: true},
		{name: "valid range selects", inner: "learning/code/ex-02-range/lines.py#L2-L4", want: []string{"two", "three", "four"}, ok: true},
		{name: "single line range selects", inner: "a.py#L3-L3", want: []string{"three"}, ok: true},
		{name: "reversed range selects nothing", inner: "a.py#L4-L2", ok: false},
		{name: "zero start selects nothing", inner: "a.py#L0-L2", ok: false},
		{name: "end outside selects nothing", inner: "a.py#L2-L99", ok: false},
		{name: "start outside selects nothing", inner: "a.py#L9-L12", ok: false},
		{name: "malformed range selects nothing", inner: "a.py#L3", ok: false},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			anchor, parsed := anchors.ParseLine("**`"+test.inner+"`**", 1)
			if !parsed {
				t.Fatalf("ParseLine rejected %q", test.inner)
			}
			got, selected := anchor.Select(lines)
			if selected != test.ok {
				t.Fatalf("Select ok=%v, want %v", selected, test.ok)
			}
			if test.ok && !reflect.DeepEqual(got, test.want) {
				t.Fatalf("Select=%q, want %q", got, test.want)
			}
		})
	}
}

// TestNextNonBlank proves the fence-attachment rule: an anchor binds the
// next non-blank line, whatever stands between them.
func TestNextNonBlank(t *testing.T) {
	lines := []string{
		"**`a.py`**",
		"",
		"   ",
		"```python",
		"body",
		"```",
	}
	index, ok := anchors.NextNonBlank(lines, 0)
	if !ok {
		t.Fatal("NextNonBlank found no line past the blanks")
	}
	if index != 3 {
		t.Fatalf("index=%d, want 3", index)
	}
	if _, ok := anchors.NextNonBlank(lines, 5); ok {
		t.Fatal("NextNonBlank reported a line past the end")
	}
}
