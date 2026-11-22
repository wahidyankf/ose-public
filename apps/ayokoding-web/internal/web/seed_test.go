package web_test

import (
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

// seedFixtureTree is the course-manifest tree the composer scans, held in
// memory so the unit run reads no disk.
func seedFixtureTree() fstest.MapFS {
	return fstest.MapFS{
		"en/learn/courses/go-basics/_index.md":    seedFile("---\ntitle: Go Basics\ndescription: Learn Go\ncategory: fundamentals\nformat: by-example\nestimatedHours: 19\nprerequisites: [\"just-enough-go\"]\nweight: 211\n---\n\n- [Overview](/en/learn/courses/go-basics/overview)\n"),
		"en/learn/courses/outline-only/_index.md": seedFile("---\ntitle: Coming Soon\ndescription: Planned\ncategory: fundamentals\nformat: primer\nstatus: outline\nprerequisites: []\nweight: 1100\n---\n\n- [Overview](/en/learn/courses/outline-only/overview)\n"),
		"en/learn/courses/minimal/_index.md":      seedFile("---\ntitle: Minimal\ndescription: Bare manifest\ncategory: fundamentals\nformat: primer\nestimatedHours: \"6\"\n---\n\n- [Overview](/en/learn/courses/minimal/overview)\n"),
		"en/learn/courses/broken/_index.md":       seedFile("---\n:\tbad\n---\n\nBroken.\n"),
		"en/learn/courses/untitled/_index.md":     seedFile("---\ndescription: No title\n---\n\nUntitled.\n"),
		"en/learn/courses/wip/_index.md":          seedFile("---\ntitle: Work in progress\ndraft: true\n---\n\nHidden.\n"),
		"en/learn/courses/lone/_index.md":         seedFile("---\ntitle: Lone\nprerequisites: just-enough-go\n---\n\nLone.\n"),
		"en/learn/courses/mixed/_index.md":        seedFile("---\ntitle: Mixed\nprerequisites: [123]\n---\n\nMixed.\n"),
		"en/learn/courses/vague/_index.md":        seedFile("---\ntitle: Vague\nestimatedHours: lots\n---\n\nVague.\n"),
		"en/learn/courses/README.md":              seedFile("Inventory note, not a course.\n"),
		"en/learn/courses/empty/.gitkeep":         seedFile(""),
	}
}

func TestComposeCoursesScansIndexMetadata(t *testing.T) {
	courses, malformed := web.ComposeCourses(seedFixtureTree(), "en")
	if len(malformed) != 6 {
		t.Fatalf("malformed = %v, want six skipped manifests", malformed)
	}
	if len(courses) != 4 {
		t.Fatalf("courses = %v, want four catalog entries", courses)
	}
	for index := range courses {
		switch courses[index].ID {
		case "go-basics":
			course := courses[index]
			if course.Title != "Go Basics" || course.Description != "Learn Go" ||
				course.Category != "fundamentals" || course.Format != "by-example" ||
				course.Effort != "19 hours" || course.Outline {
				t.Fatalf("go-basics = %+v, want catalog metadata", course)
			}
			if len(course.Prerequisites) != 1 || course.Prerequisites[0] != "just-enough-go" {
				t.Fatalf("go-basics prerequisites = %+v", course.Prerequisites)
			}
		case "outline-only":
			course := courses[index]
			if !course.Outline || course.Effort != "" || course.Format != "primer" {
				t.Fatalf("outline-only = %+v, want outline status without effort", course)
			}
			if len(course.Prerequisites) != 0 {
				t.Fatalf("outline-only prerequisites = %+v, want none", course.Prerequisites)
			}
		case "minimal":
			course := courses[index]
			if course.Title != "Minimal" || course.Effort != "6 hours" || course.Outline {
				t.Fatalf("minimal = %+v, want coerced metadata", course)
			}
			if len(course.Prerequisites) != 0 {
				t.Fatalf("minimal prerequisites = %+v, want none", course.Prerequisites)
			}
		case "vague":
			if courses[index].Effort != "" {
				t.Fatalf("vague = %+v, want empty effort for unparseable hours", courses[index])
			}
		default:
			t.Fatalf("unexpected course %+v", courses[index])
		}
	}
}

func TestComposeCoursesMissingLocaleIsEmpty(t *testing.T) {
	courses, malformed := web.ComposeCourses(seedFixtureTree(), "id")
	if len(courses) != 0 || len(malformed) != 0 {
		t.Fatalf("missing locale = %v, %v; want empty", courses, malformed)
	}
}
