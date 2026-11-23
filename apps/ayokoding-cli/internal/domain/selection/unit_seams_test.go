package selection_test

import (
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/selection"
)

// TestParseShardRejectsUnparsableCount requires a non-numeric shard
// total to fail with the usage code.
func TestParseShardRejectsUnparsableCount(t *testing.T) {
	if _, _, err := selection.ParseShard("1/y"); err == nil {
		t.Fatal("ParseShard=nil, want the usage error")
	}
}

// TestChangedMapsOutsideCourseToInert requires a changed path above
// the content root to select nothing.
func TestChangedMapsOutsideCourseToInert(t *testing.T) {
	resolved := selection.Changed([]string{"courses/.."}, "courses", []string{"demo"})
	if len(resolved.Courses) != 0 {
		t.Fatalf("courses=%q, want none selected", resolved.Courses)
	}
}
