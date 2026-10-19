package selection_test

import (
	"slices"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/selection"
)

// TestChangedMapsPathsToSlugs requires changed files below the content
// root to select their courses, ignoring paths outside any course.
func TestChangedMapsPathsToSlugs(t *testing.T) {
	got := selection.Changed([]string{
		"courses/alpha/learning/lessons/a.md",
		"courses/beta/learning/code/ex-01-b/main.py",
		"apps/ayokoding-www/project.json",
	}, "courses", []string{"alpha", "beta"})
	if got.Mode != selection.ModeAffected {
		t.Fatalf("mode=%q, want affected", got.Mode)
	}
	if !slices.Equal(got.Courses, []string{"alpha", "beta"}) {
		t.Fatalf("courses=%q, want alpha and beta", got.Courses)
	}
	if len(got.Inert) != 0 {
		t.Fatalf("inert=%q, want none", got.Inert)
	}
}

// TestChangedSelectsOnlyOptedIn requires changed files in a course without
// a run spec to list it as inert instead of selecting it.
func TestChangedSelectsOnlyOptedIn(t *testing.T) {
	got := selection.Changed([]string{
		"courses/alpha/learning/lessons/a.md",
		"courses/gamma/learning/lessons/g.md",
	}, "courses", []string{"alpha", "beta"})
	if !slices.Equal(got.Courses, []string{"alpha"}) {
		t.Fatalf("courses=%q, want exactly alpha", got.Courses)
	}
	if !slices.Equal(got.Inert, []string{"gamma"}) {
		t.Fatalf("inert=%q, want exactly gamma", got.Inert)
	}
}

// TestChangedToolchainsSelectsEveryOptedIn requires any path below the
// toolchain catalog to select every opted-in course in full mode.
func TestChangedToolchainsSelectsEveryOptedIn(t *testing.T) {
	got := selection.Changed([]string{
		"courses/alpha/learning/lessons/a.md",
		"apps/ayokoding-cli/toolchains/python/Dockerfile",
	}, "courses", []string{"alpha", "beta"})
	if got.Mode != selection.ModeFull {
		t.Fatalf("mode=%q, want full", got.Mode)
	}
	if !slices.Equal(got.Courses, []string{"alpha", "beta"}) {
		t.Fatalf("courses=%q, want every opted-in course", got.Courses)
	}
}

// TestAllSelectsEveryOptedIn requires --all to select every opted-in
// course in full mode.
func TestAllSelectsEveryOptedIn(t *testing.T) {
	got := selection.All([]string{"beta", "alpha"})
	if got.Mode != selection.ModeFull {
		t.Fatalf("mode=%q, want full", got.Mode)
	}
	if !slices.Equal(got.Courses, []string{"alpha", "beta"}) {
		t.Fatalf("courses=%q, want sorted opted-in courses", got.Courses)
	}
}

// TestNamedSelectsExplicitCourses requires explicit courses to select
// exactly those slugs, opted in or not.
func TestNamedSelectsExplicitCourses(t *testing.T) {
	got := selection.Named([]string{"gamma"})
	if !slices.Equal(got.Courses, []string{"gamma"}) {
		t.Fatalf("courses=%q, want exactly gamma", got.Courses)
	}
	if len(got.Inert) != 0 {
		t.Fatalf("inert=%q, want none", got.Inert)
	}
}

// TestShardSplitsBySortedSlug requires shard 2 of 2 over five slugs to
// keep the even positions.
func TestShardSplitsBySortedSlug(t *testing.T) {
	got, err := selection.Shard([]string{"a5", "a3", "a1", "a4", "a2"}, 2, 2)
	if err != nil {
		t.Fatalf("Shard=%v, want nil", err)
	}
	if !slices.Equal(got, []string{"a2", "a4"}) {
		t.Fatalf("shard=%q, want a2 and a4", got)
	}
}

// TestShardsCoverWithoutOverlap requires every shard family to partition
// the selection: no slug twice, no slug missing.
func TestShardsCoverWithoutOverlap(t *testing.T) {
	courses := []string{"a1", "a2", "a3", "a4", "a5"}
	for total := 1; total <= 3; total++ {
		seen := map[string]int{}
		for shard := 1; shard <= total; shard++ {
			part, err := selection.Shard(courses, shard, total)
			if err != nil {
				t.Fatalf("Shard(%d/%d)=%v, want nil", shard, total, err)
			}
			for _, slug := range part {
				seen[slug]++
			}
		}
		for _, slug := range courses {
			if seen[slug] != 1 {
				t.Fatalf("slug %q seen %d times over %d shards, want once", slug, seen[slug], total)
			}
		}
	}
}

// TestParseShardRejectsInvalidText requires every malformed shard to be a
// usage error.
func TestParseShardRejectsInvalidText(t *testing.T) {
	for _, text := range []string{"", "1", "0/2", "3/2", "a/b", "1/2/3", "1/0", "-1/2"} {
		_, _, err := selection.ParseShard(text)
		if finding.ExitCode(err) != 2 {
			t.Fatalf("ParseShard(%q)=%v, want a usage error", text, err)
		}
	}
}

// TestShardRejectsOutOfRange requires a shard outside 1..N to be a usage
// error.
func TestShardRejectsOutOfRange(t *testing.T) {
	for _, pair := range [][2]int{{0, 2}, {3, 2}, {1, 0}} {
		if _, err := selection.Shard([]string{"a1"}, pair[0], pair[1]); finding.ExitCode(err) != 2 {
			t.Fatalf("Shard(%d/%d)=%v, want a usage error", pair[0], pair[1], err)
		}
	}
}

// TestApplyShardKeepsAllWhenEmpty requires an empty shard to keep every
// course without parsing.
func TestApplyShardKeepsAllWhenEmpty(t *testing.T) {
	got, err := selection.ApplyShard([]string{"b", "a"}, "")
	if err != nil {
		t.Fatalf("ApplyShard=%v, want nil", err)
	}
	if !slices.Equal(got, []string{"b", "a"}) {
		t.Fatalf("courses=%q, want the input order kept", got)
	}
}
