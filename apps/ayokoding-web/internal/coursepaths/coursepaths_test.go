package coursepaths_test

import (
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/coursepaths"
)

func fixtureStore() *coursepaths.FakeStore {
	return coursepaths.NewFakeStore(
		[]coursepaths.LearningPath{
			{
				ID: "backend-id", Title: "Backend", Category: "careers",
				Phases: []coursepaths.Phase{
					{Name: "Fundamentals", Courses: []string{"go-basics"}},
					{Name: "Practice", Courses: []string{"go-web"}},
				},
			},
		},
		[]coursepaths.Course{
			{ID: "go-basics", Title: "Go Basics", Category: "fundamentals", Format: "course", Effort: "4 weeks"},
			{ID: "go-web", Title: "Go Web", Category: "fundamentals", Format: "course", Effort: "6 weeks", Prerequisites: []string{"go-basics"}},
			{ID: "outline-only", Title: "Coming Soon", Category: "fundamentals", Format: "course", Effort: "TBD", Outline: true},
		},
		[]string{"broken-manifest.json"},
	)
}

func TestPathsFollowManifestPhaseOrder(t *testing.T) {
	store := fixtureStore()
	var found *coursepaths.LearningPath
	for _, p := range store.Paths() {
		if p.ID == "backend-id" {
			path := p
			found = &path
		}
	}
	if found == nil {
		t.Fatal("valid path must be available")
	}
	if len(found.Phases) != 2 || found.Phases[0].Name != "Fundamentals" {
		t.Fatalf("phases = %+v, want manifest order", found.Phases)
	}
}

func TestMalformedManifestExcludedWithDiagnostic(t *testing.T) {
	store := fixtureStore()
	for _, p := range store.Paths() {
		if p.ID == "broken-manifest" {
			t.Fatal("malformed manifest must be excluded")
		}
	}
	if len(store.Diagnostics()) == 0 {
		t.Fatal("malformed manifest must produce a developer diagnostic")
	}
}

func TestPrerequisitesResolveTitles(t *testing.T) {
	store := fixtureStore()
	reqs := store.Prerequisites("go-web")
	if len(reqs) != 1 || reqs[0].Title != "Go Basics" {
		t.Fatalf("prerequisites = %+v, want [Go Basics]", reqs)
	}
}

func TestInvalidPathContextFallsBack(t *testing.T) {
	store := fixtureStore()
	if store.PathContains("no-such-path", "go-basics") {
		t.Fatal("unknown path must not claim the course")
	}
	if !store.PathContains("backend-id", "go-basics") {
		t.Fatal("valid path must contain its course")
	}
}

func TestOutlineCourseHonest(t *testing.T) {
	store := fixtureStore()
	course, ok := store.Course("outline-only")
	if !ok {
		t.Fatal("outline course must resolve")
	}
	if !course.Outline {
		t.Fatal("outline course must report outline status")
	}
	if _, ok := store.Course("missing"); ok {
		t.Fatal("missing course must not resolve")
	}
}

func TestPathResolvesAndMisses(t *testing.T) {
	store := fixtureStore()
	path, ok := store.Path("backend-id")
	if !ok || path.Title != "Backend" {
		t.Fatalf("path = %+v, %v; want Backend", path, ok)
	}
	if _, ok := store.Path("missing"); ok {
		t.Fatal("missing path must not resolve")
	}
}

func TestPrerequisitesUnknownCourse(t *testing.T) {
	if reqs := fixtureStore().Prerequisites("missing"); len(reqs) != 0 {
		t.Fatalf("unknown course prerequisites = %v, want none", reqs)
	}
}

func TestPathContainsUnknownPath(t *testing.T) {
	if fixtureStore().PathContains("missing", "go-basics") {
		t.Fatal("unknown path must not contain courses")
	}
}

func TestPathContainsMember(t *testing.T) {
	if !fixtureStore().PathContains("backend-id", "go-basics") {
		t.Fatal("valid path must contain its course")
	}
}

func TestPathContainsNonMember(t *testing.T) {
	if fixtureStore().PathContains("backend-id", "outline-only") {
		t.Fatal("valid path must not contain an outside course")
	}
}
