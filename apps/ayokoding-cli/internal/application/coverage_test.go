package application_test

import (
	"strings"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/coverage"
)

// staticRunSpec is a valid static run spec: syntax only, never executed.
const staticRunSpec = `schema: ayokoding.run/v1
toolchain: python
mode: static
static:
  reason: ios
  note: Syntax only; UIKit exists only on Apple platforms.
runs:
  - name: parse
    command: [python3, check.py]
    expect:
      exit: 0
      stdout: expected/parse.stdout.txt
`

// halfCoveredContent holds one clean covered course, one applicable but
// uncovered course without a run spec, and one course without code.
func halfCoveredContent() fstest.MapFS {
	content := fstest.MapFS{}
	content["alpha/learning/code/ex-01-hello/run.yaml"] = &fstest.MapFile{Data: []byte(validRunSpec)}
	content["alpha/learning/code/ex-01-hello/example.py"] = &fstest.MapFile{Data: []byte("print('hello')\n")}
	content["alpha/learning/code/ex-01-hello/expected/main.stdout.txt"] = &fstest.MapFile{Data: []byte("hello\n")}
	content["alpha/learning/lessons/hello.md"] = &fstest.MapFile{Data: []byte(checkLesson)}
	content["beta/learning/code/ex-01-b/main.py"] = &fstest.MapFile{Data: []byte("print(1)\n")}
	content["beta/learning/lessons/b.md"] = &fstest.MapFile{Data: []byte("# B\n")}
	content["docs/learning/lessons/about.md"] = &fstest.MapFile{Data: []byte("# About\n")}
	return content
}

// TestCoverageReportsCoveredCourse requires a clean course with every
// unit covered to report covered with 1 of 1 units and no finding.
func TestCoverageReportsCoveredCourse(t *testing.T) {
	report, err := application.Coverage(application.CoverageRequest{
		Content: checkContent(),
		Catalog: testCatalog(),
		Courses: []string{"demo"},
	})
	if err != nil {
		t.Fatalf("Coverage=%v, want nil", err)
	}
	if len(report.Report.Courses) != 1 || !report.Report.Courses[0].Covered {
		t.Fatalf("courses=%+v, want demo covered", report.Report.Courses)
	}
	if report.Report.Courses[0].Units != 1 || report.Report.Courses[0].CoveredUnits != 1 {
		t.Fatalf("course=%+v, want 1 of 1 units", report.Report.Courses[0])
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
}

// TestCoverageBelowMinimumFails requires one covered course of two to
// report 50 percent with the below-minimum finding at minimum 100,
// leaving the course without code out of the percentage.
func TestCoverageBelowMinimumFails(t *testing.T) {
	report, err := application.Coverage(application.CoverageRequest{
		Content:      halfCoveredContent(),
		Catalog:      testCatalog(),
		IncludeInert: true,
		MinPercent:   100,
	})
	if err != nil {
		t.Fatalf("Coverage=%v, want nil", err)
	}
	if report.Report.Applicable != 2 {
		t.Fatalf("applicable=%d, want 2", report.Report.Applicable)
	}
	if report.Report.Percent != 50 {
		t.Fatalf("percent=%d, want 50", report.Report.Percent)
	}
	if len(report.Findings) != 1 || report.Findings[0].Code != coverage.CodeBelowMinimum {
		t.Fatalf("findings=%+v, want one below-minimum", report.Findings)
	}
	if !strings.Contains(report.Findings[0].Message, "50") {
		t.Fatalf("finding=%+v, want the message to name 50 percent", report.Findings[0])
	}
}

// TestCoverageListsNotApplicable requires the course without code to list
// as not applicable outside the percentage.
func TestCoverageListsNotApplicable(t *testing.T) {
	report, err := application.Coverage(application.CoverageRequest{
		Content:      halfCoveredContent(),
		Catalog:      testCatalog(),
		IncludeInert: true,
	})
	if err != nil {
		t.Fatalf("Coverage=%v, want nil", err)
	}
	var docs coverage.Course
	for _, course := range report.Report.Courses {
		if course.Slug == "docs" {
			docs = course
		}
	}
	if docs.Slug == "" {
		t.Fatalf("courses=%+v, want docs listed", report.Report.Courses)
	}
	if docs.Applicable || docs.Covered {
		t.Fatalf("course=%+v, want docs not applicable and never covered", docs)
	}
}

// TestCoverageCountsIllustrationsAndStatic requires three illustration
// blocks and one static unit to count per course.
func TestCoverageCountsIllustrationsAndStatic(t *testing.T) {
	lesson := "# S\n\n**`learning/code/ex-01-s/check.py`**\n\n```python\nprint(1)\n```\n\n" +
		"<!-- harness: illustration -->\n\n```python\nprint(2)\n```\n\n" +
		"<!-- harness: illustration -->\n\n```python\nprint(3)\n```\n\n" +
		"<!-- harness: illustration -->\n\n```python\nprint(4)\n```\n\n" +
		"**Output** (`learning/code/ex-01-s/expected/parse.stdout.txt`):\n\n```text\n1\n```\n"
	content := fstest.MapFS{
		"alpha/learning/code/ex-01-s/run.yaml":                  {Data: []byte(staticRunSpec)},
		"alpha/learning/code/ex-01-s/check.py":                  {Data: []byte("print(1)\n")},
		"alpha/learning/code/ex-01-s/expected/parse.stdout.txt": {Data: []byte("1\n")},
		"alpha/learning/lessons/s.md":                           {Data: []byte(lesson)},
	}
	report, err := application.Coverage(application.CoverageRequest{
		Content: content,
		Catalog: testCatalog(),
		Courses: []string{"alpha"},
	})
	if err != nil {
		t.Fatalf("Coverage=%v, want nil", err)
	}
	if len(report.Report.Courses) != 1 {
		t.Fatalf("courses=%+v, want alpha", report.Report.Courses)
	}
	got := report.Report.Courses[0]
	if got.IllustrationFences != 3 {
		t.Fatalf("course=%+v, want 3 illustration blocks", got)
	}
	if got.StaticUnits != 1 {
		t.Fatalf("course=%+v, want 1 static unit", got)
	}
	if !got.Covered {
		t.Fatalf("course=%+v, want alpha covered", got)
	}
}
