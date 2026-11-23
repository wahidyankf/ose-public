package coverage_test

import (
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/coverage"
)

// TestCountFencesClassesLeadingFence requires a lesson that opens with
// a fence to count it bare.
func TestCountFencesClassesLeadingFence(t *testing.T) {
	counts := coverage.CountFences("```py\ncode\n```\n")
	if counts.Code != 1 || counts.Anchored != 0 {
		t.Fatalf("counts=%+v, want one bare fence", counts)
	}
}

// TestCountFencesIgnoresShortRuns requires a broken fence run to stay
// out of the fence counts.
func TestCountFencesIgnoresShortRuns(t *testing.T) {
	for _, lesson := range []string{"``\n", "``x\n"} {
		counts := coverage.CountFences(lesson)
		if counts.Code != 0 {
			t.Fatalf("counts=%+v, want no fences for %q", counts, lesson)
		}
	}
}

// TestCountFencesClosesAtEndOfInput requires an unclosed fence to run
// to the last line.
func TestCountFencesClosesAtEndOfInput(t *testing.T) {
	counts := coverage.CountFences("text\n```py\ncode\n")
	if counts.Code != 1 {
		t.Fatalf("counts=%+v, want the unclosed fence", counts)
	}
}
