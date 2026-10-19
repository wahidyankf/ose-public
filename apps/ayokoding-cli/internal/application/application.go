// Package application owns the validate, sync, and toolchains use cases over
// course content and the toolchain catalog.
package application

import (
	"fmt"
	"io/fs"
	"sort"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/layout"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/runspec"
)

// ValidateRequest selects the courses to validate: named courses validate as
// if opted in, otherwise every opted-in course, or every course with
// IncludeInert.
type ValidateRequest struct {
	Content      fs.FS
	Catalog      catalog.Catalog
	Courses      []string
	IncludeInert bool
}

// Validate checks the selected courses and returns every finding in course,
// path, line, and code order.
func Validate(req ValidateRequest) ([]finding.Finding, error) {
	courses, err := selectCourses(req.Content, req.Courses, req.IncludeInert)
	if err != nil {
		return nil, err
	}
	var findings []finding.Finding
	for _, course := range courses {
		courseFindings, courseErr := validateCourse(req, course)
		if courseErr != nil {
			return nil, courseErr
		}
		findings = append(findings, courseFindings...)
	}
	sortFindings(findings)
	return findings, nil
}

// ListToolchains returns the catalog entries in id order.
func ListToolchains(cat catalog.Catalog) []catalog.Toolchain {
	entries := append([]catalog.Toolchain(nil), cat.Toolchains...)
	sort.Slice(entries, func(i, j int) bool { return entries[i].ID < entries[j].ID })
	return entries
}

// selectCourses resolves the selection: named courses must exist, otherwise
// every opted-in course, or every course with includeInert.
func selectCourses(content fs.FS, courses []string, includeInert bool) ([]string, error) {
	if len(courses) != 0 {
		for _, course := range courses {
			info, err := fs.Stat(content, course)
			if err != nil || !info.IsDir() {
				return nil, &finding.Error{
					Code:    finding.UsageInvalidArguments,
					Message: "course " + course + " does not exist",
				}
			}
		}
		return append([]string(nil), courses...), nil
	}
	entries, err := fs.ReadDir(content, ".")
	if err != nil {
		return nil, fmt.Errorf("application: list courses: %w", err)
	}
	var selected []string
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		if includeInert {
			selected = append(selected, entry.Name())
			continue
		}
		sub, subErr := fs.Sub(content, entry.Name())
		if subErr != nil {
			return nil, fmt.Errorf("application: open course %q: %w", entry.Name(), subErr)
		}
		if layout.IsOptedIn(sub) {
			selected = append(selected, entry.Name())
		}
	}
	sort.Strings(selected)
	return selected, nil
}

// validateCourse checks one course: placement, then every covered unit spec.
func validateCourse(req ValidateRequest, course string) ([]finding.Finding, error) {
	sub, err := fs.Sub(req.Content, course)
	if err != nil {
		return nil, fmt.Errorf("application: open course %q: %w", course, err)
	}
	units, findings := layout.Discover(course, sub)
	findings = append(findings, layout.MissingSpecs(course, sub, units)...)
	for _, unit := range units {
		data, readErr := fs.ReadFile(sub, unit.Path+"/run.yaml")
		if readErr != nil {
			continue
		}
		_, specFindings := runspec.Parse(course, unit.Path, data, req.Catalog)
		findings = append(findings, specFindings...)
	}
	return findings, nil
}

// sortFindings orders findings by course, path, line, and code, so the same
// inputs give the same bytes.
func sortFindings(findings []finding.Finding) {
	sort.Slice(findings, func(i, j int) bool {
		left, right := findings[i], findings[j]
		if left.Course != right.Course {
			return left.Course < right.Course
		}
		if left.Path != right.Path {
			return left.Path < right.Path
		}
		if left.Line != right.Line {
			return left.Line < right.Line
		}
		return left.Code < right.Code
	})
}
