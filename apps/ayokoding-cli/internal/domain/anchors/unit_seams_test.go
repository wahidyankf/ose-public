package anchors_test

import (
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/anchors"
)

// TestParseLineRejectsOverflowingRange requires a range past int64 to
// mark the anchor malformed instead of wrapping.
func TestParseLineRejectsOverflowingRange(t *testing.T) {
	anchor, ok := anchors.ParseLine("**`target.py#L99999999999999999999-L1`**", 3)
	if !ok {
		t.Fatal("ParseLine=false, want the anchor parsed")
	}
	if !anchor.Malformed {
		t.Fatalf("anchor=%+v, want malformed", anchor)
	}
}

// TestNextNonBlankRejectsEmptyInput requires a nil line slice to
// report no next line.
func TestNextNonBlankRejectsEmptyInput(t *testing.T) {
	if _, ok := anchors.NextNonBlank(nil, 0); ok {
		t.Fatal("NextNonBlank=true, want false for nil lines")
	}
}

// TestSelectRejectsEmptyInput requires a nil line slice to fail the
// selection.
func TestSelectRejectsEmptyInput(t *testing.T) {
	anchor, ok := anchors.ParseLine("**`target.py`**", 1)
	if !ok {
		t.Fatal("ParseLine=false, want the anchor parsed")
	}
	if _, ok := anchor.Select(nil); ok {
		t.Fatal("Select=true, want false for nil lines")
	}
}
