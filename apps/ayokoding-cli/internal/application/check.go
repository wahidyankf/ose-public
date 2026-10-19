package application

import (
	"context"
	"fmt"
	"io/fs"
	"sort"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/coverage"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/layout"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/selection"
)

// InertMessage reports a content tree with no opted-in course: nothing
// was selected, so nothing ran.
const InertMessage = "0 opted-in courses; nothing to run"

// missingSelectionMessage is the usage text every selection entry point
// shares: exactly one of --course, --since, or --all is required.
const missingSelectionMessage = "one of --course, --since, or --all is required"

// CheckRequest selects the courses to check: named courses check as if
// opted in, otherwise every opted-in course with All or the courses
// changed since Since. The run phase needs ContentDir for recording
// paths; checks without Record leave it empty. ChangedFiles carries the
// repo-relative changed paths for Since; ContentPrefix is the
// repo-relative content root they map through.
type CheckRequest struct {
	Content       fs.FS
	ContentDir    string
	Catalog       catalog.Catalog
	Courses       []string
	All           bool
	Since         string
	Shard         string
	ChangedFiles  []string
	ContentPrefix string
	Runtime       Runtime
	EnvBuilder    EnvImageBuilder
	Settings      containerplan.Settings
	RunID         string
	Links         []containerplan.Link
	Now           func() time.Time
	Sleep         func(time.Duration)
}

// CheckReport holds every check outcome: the combined validate, sync, and
// run findings with the green runs, the static coverage report at minimum
// 0, the resolved selection, and the inert message when no opted-in
// course exists. A nil error with findings means exit 1; a coded error
// means its supervisor status.
type CheckReport struct {
	Findings  []finding.Finding
	Passed    []PassedRun
	Coverage  coverage.Report
	Selection selection.Selection
	Message   string
}

// AffectedRequest selects the courses to preview: named courses select as
// if opted in, otherwise every opted-in course with All or the courses
// changed since Since. ChangedFiles carries the repo-relative changed
// paths; ContentPrefix is the repo-relative content root they map
// through.
type AffectedRequest struct {
	Content       fs.FS
	Courses       []string
	All           bool
	Since         string
	Shard         string
	ChangedFiles  []string
	ContentPrefix string
}

// CoverageRequest selects the courses to cover: named courses cover as if
// opted in, otherwise every opted-in course, or every course with
// IncludeInert. MinPercent fails the report below its percentage.
type CoverageRequest struct {
	Content      fs.FS
	Catalog      catalog.Catalog
	Courses      []string
	IncludeInert bool
	MinPercent   int
}

// CoverageReport holds the assessed coverage with the below-minimum
// finding when the percentage missed it.
type CoverageReport struct {
	Report   coverage.Report
	Findings []finding.Finding
}

// Affected resolves the course selection without running anything: the
// mode with the selected and inert courses.
func Affected(req AffectedRequest) (selection.Selection, error) {
	if len(req.Courses) == 0 && req.Since == "" && !req.All {
		return selection.Selection{}, &finding.Error{
			Code:    finding.UsageMissingSelection,
			Message: missingSelectionMessage,
		}
	}
	var resolved selection.Selection
	switch {
	case len(req.Courses) != 0:
		validated, err := selectCourses(req.Content, req.Courses, false)
		if err != nil {
			return selection.Selection{}, err
		}
		resolved = selection.Named(validated)
	case req.All:
		optedIn, err := optedInCourses(req.Content)
		if err != nil {
			return selection.Selection{}, err
		}
		resolved = selection.All(optedIn)
	default:
		optedIn, err := optedInCourses(req.Content)
		if err != nil {
			return selection.Selection{}, err
		}
		resolved = selection.Changed(req.ChangedFiles, req.ContentPrefix, optedIn)
	}
	courses, err := selection.ApplyShard(resolved.Courses, req.Shard)
	if err != nil {
		return selection.Selection{}, fmt.Errorf("application: slice shard: %w", err)
	}
	resolved.Courses = courses
	return resolved, nil
}

// Failed reports whether the report holds any negative finding.
func (report CheckReport) Failed() bool {
	return len(report.Findings) != 0
}

// Check validates, syncs, and runs the selection in order. Named courses
// check as if opted in; otherwise validation and sync cover every
// opted-in course while the run covers the selection: the changed courses
// with Since, every opted-in course with All, sliced by Shard. Coverage
// is reported at minimum 0 over every course. A tree with no opted-in
// course reports the inert message without touching the runtime.
// Validation, sync, and run findings join the report, deduplicated: a
// unit without a run spec is reported once however many phases notice it.
// Usage failures outrank environment failures, which outrank findings.
func Check(ctx context.Context, req CheckRequest) (CheckReport, error) {
	if len(req.Courses) == 0 && req.Since == "" && !req.All {
		return CheckReport{}, &finding.Error{
			Code:    finding.UsageMissingSelection,
			Message: missingSelectionMessage,
		}
	}
	resolved, err := Affected(AffectedRequest{
		Content:       req.Content,
		Courses:       req.Courses,
		All:           req.All,
		Since:         req.Since,
		Shard:         req.Shard,
		ChangedFiles:  req.ChangedFiles,
		ContentPrefix: req.ContentPrefix,
	})
	if err != nil {
		return CheckReport{}, err
	}
	report := CheckReport{Selection: resolved}
	if len(req.Courses) == 0 {
		optedIn, err := optedInCourses(req.Content)
		if err != nil {
			return CheckReport{}, err
		}
		if len(optedIn) == 0 {
			report.Message = InertMessage
			report.Coverage, err = checkCoverage(req)
			if err != nil {
				return CheckReport{}, err
			}
			return report, nil
		}
	}
	static := req.Courses
	if len(req.Courses) == 0 {
		optedIn, err := optedInCourses(req.Content)
		if err != nil {
			return CheckReport{}, err
		}
		static = optedIn
	}
	validateFindings, err := Validate(ValidateRequest{
		Content: req.Content,
		Catalog: req.Catalog,
		Courses: static,
	})
	if err != nil {
		return CheckReport{}, err
	}
	syncFindings, err := Sync(SyncRequest{
		Content:    req.Content,
		ContentDir: req.ContentDir,
		Courses:    static,
	})
	if err != nil {
		return CheckReport{}, err
	}
	findings := dedupFindings(validateFindings, syncFindings)
	if len(resolved.Courses) != 0 {
		runReport, err := Run(ctx, RunRequest{
			Content:    req.Content,
			ContentDir: req.ContentDir,
			Catalog:    req.Catalog,
			Courses:    resolved.Courses,
			Runtime:    req.Runtime,
			EnvBuilder: req.EnvBuilder,
			Settings:   req.Settings,
			RunID:      req.RunID,
			Links:      req.Links,
			Now:        req.Now,
			Sleep:      req.Sleep,
		})
		if err != nil {
			return CheckReport{}, err
		}
		findings = dedupFindings(findings, runReport.Findings)
		report.Passed = runReport.Passed
	}
	report.Findings = findings
	report.Coverage, err = checkCoverage(req)
	if err != nil {
		return CheckReport{}, err
	}
	return report, nil
}

// checkCoverage reports the static coverage over every course at minimum
// 0: it never fails the check.
func checkCoverage(req CheckRequest) (coverage.Report, error) {
	entries, err := fs.ReadDir(req.Content, ".")
	if err != nil {
		return coverage.Report{}, fmt.Errorf("application: list courses: %w", err)
	}
	var courses []string
	for _, entry := range entries {
		if entry.IsDir() {
			courses = append(courses, entry.Name())
		}
	}
	validateFindings, err := Validate(ValidateRequest{
		Content:      req.Content,
		Catalog:      req.Catalog,
		Courses:      courses,
		IncludeInert: true,
	})
	if err != nil {
		return coverage.Report{}, err
	}
	syncFindings, err := Sync(SyncRequest{
		Content:      req.Content,
		ContentDir:   req.ContentDir,
		Courses:      courses,
		IncludeInert: true,
	})
	if err != nil {
		return coverage.Report{}, err
	}
	return assessCoverage(req.Content, req.Catalog, courses, validateFindings, syncFindings)
}

// optedInCourses lists every opted-in course in sorted order.
func optedInCourses(content fs.FS) ([]string, error) {
	entries, err := fs.ReadDir(content, ".")
	if err != nil {
		return nil, fmt.Errorf("application: list courses: %w", err)
	}
	var optedIn []string
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		sub, subErr := fs.Sub(content, entry.Name())
		if subErr != nil {
			return nil, fmt.Errorf("application: open course %q: %w", entry.Name(), subErr)
		}
		if layout.IsOptedIn(sub) {
			optedIn = append(optedIn, entry.Name())
		}
	}
	sort.Strings(optedIn)
	return optedIn, nil
}

// dedupFindings merges finding sets in phase order, dropping exact
// duplicates so one defect reads as one line however many phases saw it.
func dedupFindings(sets ...[]finding.Finding) []finding.Finding {
	seen := map[finding.Finding]bool{}
	var merged []finding.Finding
	for _, set := range sets {
		for _, found := range set {
			if seen[found] {
				continue
			}
			seen[found] = true
			merged = append(merged, found)
		}
	}
	sortFindings(merged)
	return merged
}
