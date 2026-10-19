package application

import (
	"fmt"
	"io/fs"
	"sort"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/coverage"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/layout"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/runspec"
)

// Coverage assesses the selected courses without running anything: the
// per-course report with the below-minimum finding when the percentage
// missed it.
func Coverage(req CoverageRequest) (CoverageReport, error) {
	courses, err := selectCourses(req.Content, req.Courses, req.IncludeInert)
	if err != nil {
		return CoverageReport{}, err
	}
	validateFindings, err := Validate(ValidateRequest{
		Content:      req.Content,
		Catalog:      req.Catalog,
		Courses:      courses,
		IncludeInert: req.IncludeInert,
	})
	if err != nil {
		return CoverageReport{}, err
	}
	syncFindings, err := Sync(SyncRequest{
		Content:      req.Content,
		Courses:      courses,
		IncludeInert: req.IncludeInert,
	})
	if err != nil {
		return CoverageReport{}, err
	}
	report, err := assessCoverage(req.Content, req.Catalog, courses, validateFindings, syncFindings)
	if err != nil {
		return CoverageReport{}, err
	}
	assessed := CoverageReport{Report: report}
	if below, misses := report.BelowMinimum(req.MinPercent); misses {
		assessed.Findings = []finding.Finding{below}
	}
	return assessed, nil
}

// assessCoverage builds the static coverage report over every named
// course: units and fence counts with the validation and sync findings
// deciding clean.
func assessCoverage(content fs.FS, cat catalog.Catalog, courses []string, validate, sync []finding.Finding) (coverage.Report, error) {
	dirty := map[string]bool{}
	for _, found := range validate {
		dirty[found.Course] = true
	}
	for _, found := range sync {
		dirty[found.Course] = true
	}
	inputs := make([]coverage.Course, 0, len(courses))
	for _, course := range courses {
		input, err := assessCourse(content, cat, course, !dirty[course])
		if err != nil {
			return coverage.Report{}, err
		}
		inputs = append(inputs, input)
	}
	sort.Slice(inputs, func(i, j int) bool { return inputs[i].Slug < inputs[j].Slug })
	return coverage.Assess(inputs), nil
}

// assessCourse counts one course: its units with the covered and static
// ones, and its lesson fences with the anchored and illustration ones.
func assessCourse(content fs.FS, cat catalog.Catalog, course string, clean bool) (coverage.Course, error) {
	sub, err := fs.Sub(content, course)
	if err != nil {
		return coverage.Course{}, fmt.Errorf("application: open course %q: %w", course, err)
	}
	input := coverage.Course{Slug: course, OptedIn: layout.IsOptedIn(sub), Applicable: layout.IsApplicable(sub), Clean: clean}
	units, _ := layout.Discover(course, sub)
	input.Units = len(units)
	for _, unit := range units {
		data, readErr := fs.ReadFile(sub, unit.Path+"/run.yaml")
		if readErr != nil {
			continue
		}
		spec, specFindings := runspec.Parse(course, unit.Path, data, cat)
		if len(specFindings) != 0 {
			continue
		}
		input.CoveredUnits++
		// A valid static spec always carries its reason; Spec.Mode stays
		// at its default, so the reason is the static signal.
		if spec.StaticReason != "" {
			input.StaticUnits++
		}
	}
	for _, lesson := range lessonFiles(sub) {
		data, readErr := fs.ReadFile(sub, lesson)
		if readErr != nil {
			continue
		}
		counts := coverage.CountFences(string(data))
		input.CodeFences += counts.Code
		input.AnchoredFences += counts.Anchored
		input.IllustrationFences += counts.Illustration
	}
	return input, nil
}
