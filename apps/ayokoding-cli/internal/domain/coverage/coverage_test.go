package coverage_test

import (
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/coverage"
)

// coveredCourse is one opted-in applicable course with two covered units
// and a clean validation and sync.
func coveredCourse(slug string) coverage.Course {
	return coverage.Course{
		Slug:               slug,
		OptedIn:            true,
		Applicable:         true,
		Units:              2,
		CoveredUnits:       2,
		CodeFences:         2,
		AnchoredFences:     2,
		IllustrationFences: 0,
		StaticUnits:        0,
		Clean:              true,
	}
}

// TestAssessCoversCleanCourse requires an opted-in course with every unit
// covered and no finding to report covered with 2 of 2 units.
func TestAssessCoversCleanCourse(t *testing.T) {
	report := coverage.Assess([]coverage.Course{coveredCourse("alpha")})
	if len(report.Courses) != 1 || !report.Courses[0].Covered {
		t.Fatalf("courses=%+v, want alpha covered", report.Courses)
	}
	if report.Courses[0].CoveredUnits != 2 || report.Courses[0].Units != 2 {
		t.Fatalf("course=%+v, want 2 of 2 units", report.Courses[0])
	}
	if report.Percent != 100 {
		t.Fatalf("percent=%d, want 100", report.Percent)
	}
}

// TestAssessLeavesUncoveredUnits requires a course with a unit missing its
// run spec to stay uncovered.
func TestAssessLeavesUncoveredUnits(t *testing.T) {
	course := coveredCourse("alpha")
	course.CoveredUnits = 1
	report := coverage.Assess([]coverage.Course{course})
	if report.Courses[0].Covered {
		t.Fatalf("course=%+v, want uncovered", report.Courses[0])
	}
	if report.Percent != 0 {
		t.Fatalf("percent=%d, want 0", report.Percent)
	}
}

// TestAssessLeavesDirtyCourse requires a course with a remaining finding
// to stay uncovered however many units it covers.
func TestAssessLeavesDirtyCourse(t *testing.T) {
	course := coveredCourse("alpha")
	course.Clean = false
	report := coverage.Assess([]coverage.Course{course})
	if report.Courses[0].Covered {
		t.Fatalf("course=%+v, want uncovered", report.Courses[0])
	}
}

// TestAssessExcludesNotApplicable requires courses without code to list
// as not applicable outside the percentage.
func TestAssessExcludesNotApplicable(t *testing.T) {
	plain := coverage.Course{Slug: "docs", OptedIn: true, Applicable: false, Clean: true}
	report := coverage.Assess([]coverage.Course{coveredCourse("alpha"), plain})
	if report.Courses[1].Covered {
		t.Fatalf("course=%+v, want docs never covered", report.Courses[1])
	}
	if report.Applicable != 1 {
		t.Fatalf("applicable=%d, want 1", report.Applicable)
	}
	if report.Percent != 100 {
		t.Fatalf("percent=%d, want 100 over applicable only", report.Percent)
	}
}

// TestAssessCountsApplicableOnly requires the percentage to divide covered
// applicable courses by applicable courses.
func TestAssessCountsApplicableOnly(t *testing.T) {
	half := coveredCourse("beta")
	half.CoveredUnits = 1
	plain := coverage.Course{Slug: "docs", OptedIn: true, Applicable: false, Clean: true}
	report := coverage.Assess([]coverage.Course{coveredCourse("alpha"), half, plain})
	if report.Covered != 1 || report.Applicable != 2 {
		t.Fatalf("report=%+v, want 1 of 2 applicable covered", report)
	}
	if report.Percent != 50 {
		t.Fatalf("percent=%d, want 50", report.Percent)
	}
}

// TestAssessKeepsIllustrationAndStaticCounts requires the per-course
// illustration and static counts to survive assessment.
func TestAssessKeepsIllustrationAndStaticCounts(t *testing.T) {
	course := coveredCourse("alpha")
	course.CodeFences = 4
	course.AnchoredFences = 1
	course.IllustrationFences = 3
	course.StaticUnits = 1
	report := coverage.Assess([]coverage.Course{course})
	got := report.Courses[0]
	if got.IllustrationFences != 3 || got.StaticUnits != 1 {
		t.Fatalf("course=%+v, want 3 illustration blocks and 1 static unit", got)
	}
	if got.CodeFences != 4 || got.AnchoredFences != 1 {
		t.Fatalf("course=%+v, want 4 code fences and 1 anchored", got)
	}
}

// TestBelowMinimumReportsFinding requires coverage below the minimum to
// report the below-minimum code.
func TestBelowMinimumReportsFinding(t *testing.T) {
	half := coveredCourse("beta")
	half.CoveredUnits = 1
	report := coverage.Assess([]coverage.Course{coveredCourse("alpha"), half})
	found, below := report.BelowMinimum(100)
	if !below {
		t.Fatalf("below=false, want the minimum missed at 50 percent")
	}
	if found.Code != coverage.CodeBelowMinimum {
		t.Fatalf("code=%q, want below-minimum", found.Code)
	}
}

// TestBelowMinimumPassesAtMinimum requires coverage at the minimum to
// report nothing.
func TestBelowMinimumPassesAtMinimum(t *testing.T) {
	report := coverage.Assess([]coverage.Course{coveredCourse("alpha")})
	if _, below := report.BelowMinimum(100); below {
		t.Fatalf("below=true, want 100 percent to meet the minimum")
	}
}

// TestCountFencesClassesAnchorsAndIllustrations requires anchored,
// illustration, and prose fences to count into their classes.
func TestCountFencesClassesAnchorsAndIllustrations(t *testing.T) {
	lesson := "# A\n\n**`learning/code/ex-01-a/main.py`**\n\n```python\nprint(1)\n```\n\n" +
		"<!-- harness: illustration -->\n\n```python\nprint(2)\n```\n\n```text\nprose\n```\n"
	got := coverage.CountFences(lesson)
	if got.Code != 2 {
		t.Fatalf("code=%d, want 2", got.Code)
	}
	if got.Anchored != 1 {
		t.Fatalf("anchored=%d, want 1", got.Anchored)
	}
	if got.Illustration != 1 {
		t.Fatalf("illustration=%d, want 1", got.Illustration)
	}
}
