// Package speccoverage provides functionality for validating BDD spec file coverage.
package speccoverage

import "time"

// ScanOptions configures how the spec coverage check should be performed.
type ScanOptions struct {
	RepoRoot    string   // Absolute path to repository root
	SpecsDir    string   // Absolute path to specs directory
	AppDir      string   // Absolute path to app directory
	Verbose     bool     // Enable verbose logging
	Quiet       bool     // Quiet mode (errors only)
	SharedSteps bool     // Skip file matching, validate steps across ALL files
	ExcludeDirs []string // Directory names to exclude from spec walking (e.g., "test-support")
}

// CoverageGap represents a spec file that has no matching test implementation.
type CoverageGap struct {
	SpecFile string // Path to spec file (relative to repo root)
	Stem     string // Feature file stem (e.g. "user-login" from "user-login.feature")
}

// ScenarioGap is a scenario in a feature file with no matching Scenario(...) in the test file.
type ScenarioGap struct {
	SpecFile      string // relative path from repo root
	ScenarioTitle string // the missing scenario title
}

// StepGap is a step in a feature file with no matching step definition anywhere in the app.
type StepGap struct {
	SpecFile      string // relative path from repo root
	ScenarioTitle string // scenario that contains the missing step
	StepKeyword   string // Given/When/Then/And/But
	StepText      string // exact step text
}

// CheckResult contains the results of a spec coverage check.
type CheckResult struct {
	TotalSpecs     int
	TotalScenarios int
	TotalSteps     int
	Gaps           []CoverageGap // file-level gaps
	ScenarioGaps   []ScenarioGap // scenario-level gaps
	StepGaps       []StepGap     // step-level gaps
	Duration       time.Duration
}
