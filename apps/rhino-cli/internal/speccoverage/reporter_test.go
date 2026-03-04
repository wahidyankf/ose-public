package speccoverage

import (
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func TestFormatText_NoCoverage(t *testing.T) {
	result := &CheckResult{
		TotalSpecs:     5,
		TotalScenarios: 12,
		TotalSteps:     48,
		Gaps:           []CoverageGap{},
		Duration:       50 * time.Millisecond,
	}

	out := FormatText(result, false, false)

	if !strings.Contains(out, "✓ Spec coverage valid!") {
		t.Errorf("Expected success message, got: %q", out)
	}
	if !strings.Contains(out, "5 specs") {
		t.Errorf("Expected spec count, got: %q", out)
	}
	if !strings.Contains(out, "12 scenarios") {
		t.Errorf("Expected scenario count, got: %q", out)
	}
	if !strings.Contains(out, "48 steps") {
		t.Errorf("Expected step count, got: %q", out)
	}
	if !strings.Contains(out, "all covered") {
		t.Errorf("Expected 'all covered', got: %q", out)
	}
}

func TestFormatText_NoCoverage_Quiet(t *testing.T) {
	result := &CheckResult{
		TotalSpecs:     3,
		TotalScenarios: 6,
		TotalSteps:     18,
		Gaps:           []CoverageGap{},
		Duration:       10 * time.Millisecond,
	}

	out := FormatText(result, false, true)

	if out != "" {
		t.Errorf("Expected empty output in quiet mode, got: %q", out)
	}
}

func TestFormatText_WithFileGaps(t *testing.T) {
	result := &CheckResult{
		TotalSpecs:     3,
		TotalScenarios: 0,
		TotalSteps:     0,
		Gaps: []CoverageGap{
			{SpecFile: "specs/auth/user-login.feature", Stem: "user-login"},
			{SpecFile: "specs/dashboard.feature", Stem: "dashboard"},
		},
		Duration: 30 * time.Millisecond,
	}

	out := FormatText(result, false, false)

	if !strings.Contains(out, "✗ Spec coverage gaps found!") {
		t.Errorf("Expected failure message, got: %q", out)
	}
	if !strings.Contains(out, "Missing test files (2)") {
		t.Errorf("Expected file gap section, got: %q", out)
	}
	if !strings.Contains(out, "specs/auth/user-login.feature") {
		t.Errorf("Expected spec file path, got: %q", out)
	}
	if !strings.Contains(out, "user-login") {
		t.Errorf("Expected stem hint, got: %q", out)
	}
	if !strings.Contains(out, "specs/dashboard.feature") {
		t.Errorf("Expected second gap, got: %q", out)
	}
}

func TestFormatText_WithScenarioGaps(t *testing.T) {
	result := &CheckResult{
		TotalSpecs:     1,
		TotalScenarios: 2,
		TotalSteps:     4,
		Gaps:           []CoverageGap{},
		ScenarioGaps: []ScenarioGap{
			{SpecFile: "specs/auth/user-login.feature", ScenarioTitle: "Login with SSO"},
		},
		Duration: 20 * time.Millisecond,
	}

	out := FormatText(result, false, false)

	if !strings.Contains(out, "✗ Spec coverage gaps found!") {
		t.Errorf("Expected failure message, got: %q", out)
	}
	if !strings.Contains(out, "Missing scenarios (1)") {
		t.Errorf("Expected scenario gap section, got: %q", out)
	}
	if !strings.Contains(out, "Login with SSO") {
		t.Errorf("Expected scenario title, got: %q", out)
	}
	if !strings.Contains(out, "specs/auth/user-login.feature") {
		t.Errorf("Expected spec file, got: %q", out)
	}
}

func TestFormatText_WithStepGaps(t *testing.T) {
	result := &CheckResult{
		TotalSpecs:     1,
		TotalScenarios: 1,
		TotalSteps:     3,
		Gaps:           []CoverageGap{},
		StepGaps: []StepGap{
			{
				SpecFile:      "specs/members/member-list.feature",
				ScenarioTitle: "Export member list",
				StepKeyword:   "Given",
				StepText:      "the member list has been loaded",
			},
			{
				SpecFile:      "specs/members/member-list.feature",
				ScenarioTitle: "Export member list",
				StepKeyword:   "When",
				StepText:      `the user clicks "Export CSV"`,
			},
		},
		Duration: 15 * time.Millisecond,
	}

	out := FormatText(result, false, false)

	if !strings.Contains(out, "Missing steps (2)") {
		t.Errorf("Expected step gap section, got: %q", out)
	}
	if !strings.Contains(out, "Export member list") {
		t.Errorf("Expected scenario title, got: %q", out)
	}
	if !strings.Contains(out, "the member list has been loaded") {
		t.Errorf("Expected step text, got: %q", out)
	}
	if !strings.Contains(out, `the user clicks "Export CSV"`) {
		t.Errorf("Expected second step text, got: %q", out)
	}
}

func TestFormatJSON_Success(t *testing.T) {
	result := &CheckResult{
		TotalSpecs:     9,
		TotalScenarios: 47,
		TotalSteps:     203,
		Gaps:           []CoverageGap{},
		ScenarioGaps:   []ScenarioGap{},
		StepGaps:       []StepGap{},
		Duration:       100 * time.Millisecond,
	}

	jsonStr, err := FormatJSON(result)
	if err != nil {
		t.Fatalf("FormatJSON() error = %v", err)
	}

	var out JSONOutput
	if err := json.Unmarshal([]byte(jsonStr), &out); err != nil {
		t.Fatalf("Failed to parse JSON: %v", err)
	}

	if out.Status != "success" {
		t.Errorf("Status = %q, want %q", out.Status, "success")
	}
	if out.TotalSpecs != 9 {
		t.Errorf("TotalSpecs = %d, want 9", out.TotalSpecs)
	}
	if out.TotalScenarios != 47 {
		t.Errorf("TotalScenarios = %d, want 47", out.TotalScenarios)
	}
	if out.TotalSteps != 203 {
		t.Errorf("TotalSteps = %d, want 203", out.TotalSteps)
	}
	if out.GapCount != 0 {
		t.Errorf("GapCount = %d, want 0", out.GapCount)
	}
	if out.ScenarioGapCount != 0 {
		t.Errorf("ScenarioGapCount = %d, want 0", out.ScenarioGapCount)
	}
	if out.StepGapCount != 0 {
		t.Errorf("StepGapCount = %d, want 0", out.StepGapCount)
	}
	if out.Timestamp == "" {
		t.Error("Timestamp should not be empty")
	}
	if len(out.Gaps) != 0 {
		t.Errorf("Gaps = %v, want empty", out.Gaps)
	}
	if len(out.ScenarioGaps) != 0 {
		t.Errorf("ScenarioGaps = %v, want empty", out.ScenarioGaps)
	}
	if len(out.StepGaps) != 0 {
		t.Errorf("StepGaps = %v, want empty", out.StepGaps)
	}
}

func TestFormatJSON_WithFileGap(t *testing.T) {
	result := &CheckResult{
		TotalSpecs: 3,
		Gaps: []CoverageGap{
			{SpecFile: "specs/missing.feature", Stem: "missing"},
		},
		ScenarioGaps: []ScenarioGap{},
		StepGaps:     []StepGap{},
		Duration:     42 * time.Millisecond,
	}

	jsonStr, err := FormatJSON(result)
	if err != nil {
		t.Fatalf("FormatJSON() error = %v", err)
	}

	var out JSONOutput
	if err := json.Unmarshal([]byte(jsonStr), &out); err != nil {
		t.Fatalf("Failed to parse JSON: %v", err)
	}

	if out.Status != "failure" {
		t.Errorf("Status = %q, want %q", out.Status, "failure")
	}
	if out.TotalSpecs != 3 {
		t.Errorf("TotalSpecs = %d, want 3", out.TotalSpecs)
	}
	if out.GapCount != 1 {
		t.Errorf("GapCount = %d, want 1", out.GapCount)
	}
	if out.DurationMS != 42 {
		t.Errorf("DurationMS = %d, want 42", out.DurationMS)
	}
	if len(out.Gaps) != 1 {
		t.Fatalf("Gaps count = %d, want 1", len(out.Gaps))
	}
	if out.Gaps[0].SpecFile != "specs/missing.feature" {
		t.Errorf("Gap SpecFile = %q, want %q", out.Gaps[0].SpecFile, "specs/missing.feature")
	}
	if out.Gaps[0].Stem != "missing" {
		t.Errorf("Gap Stem = %q, want %q", out.Gaps[0].Stem, "missing")
	}
}

func TestFormatJSON_WithScenarioGaps(t *testing.T) {
	result := &CheckResult{
		TotalSpecs:     1,
		TotalScenarios: 2,
		TotalSteps:     4,
		Gaps:           []CoverageGap{},
		ScenarioGaps: []ScenarioGap{
			{SpecFile: "specs/auth/login.feature", ScenarioTitle: "SSO login"},
		},
		StepGaps: []StepGap{},
		Duration: 10 * time.Millisecond,
	}

	jsonStr, err := FormatJSON(result)
	if err != nil {
		t.Fatalf("FormatJSON() error = %v", err)
	}

	var out JSONOutput
	if err := json.Unmarshal([]byte(jsonStr), &out); err != nil {
		t.Fatalf("Failed to parse JSON: %v", err)
	}

	if out.Status != "failure" {
		t.Errorf("Status = %q, want failure", out.Status)
	}
	if out.ScenarioGapCount != 1 {
		t.Errorf("ScenarioGapCount = %d, want 1", out.ScenarioGapCount)
	}
	if len(out.ScenarioGaps) != 1 {
		t.Fatalf("ScenarioGaps count = %d, want 1", len(out.ScenarioGaps))
	}
	if out.ScenarioGaps[0].SpecFile != "specs/auth/login.feature" {
		t.Errorf("ScenarioGap SpecFile = %q", out.ScenarioGaps[0].SpecFile)
	}
	if out.ScenarioGaps[0].ScenarioTitle != "SSO login" {
		t.Errorf("ScenarioGap ScenarioTitle = %q", out.ScenarioGaps[0].ScenarioTitle)
	}
}

func TestFormatJSON_WithStepGaps(t *testing.T) {
	result := &CheckResult{
		TotalSpecs:     1,
		TotalScenarios: 1,
		TotalSteps:     3,
		Gaps:           []CoverageGap{},
		ScenarioGaps:   []ScenarioGap{},
		StepGaps: []StepGap{
			{
				SpecFile:      "specs/auth/login.feature",
				ScenarioTitle: "Successful login",
				StepKeyword:   "Given",
				StepText:      "a registered user",
			},
		},
		Duration: 10 * time.Millisecond,
	}

	jsonStr, err := FormatJSON(result)
	if err != nil {
		t.Fatalf("FormatJSON() error = %v", err)
	}

	var out JSONOutput
	if err := json.Unmarshal([]byte(jsonStr), &out); err != nil {
		t.Fatalf("Failed to parse JSON: %v", err)
	}

	if out.Status != "failure" {
		t.Errorf("Status = %q, want failure", out.Status)
	}
	if out.StepGapCount != 1 {
		t.Errorf("StepGapCount = %d, want 1", out.StepGapCount)
	}
	if len(out.StepGaps) != 1 {
		t.Fatalf("StepGaps count = %d, want 1", len(out.StepGaps))
	}
	if out.StepGaps[0].Keyword != "Given" {
		t.Errorf("StepGap Keyword = %q", out.StepGaps[0].Keyword)
	}
	if out.StepGaps[0].StepText != "a registered user" {
		t.Errorf("StepGap StepText = %q", out.StepGaps[0].StepText)
	}
}

func TestFormatMarkdown_SameAsText(t *testing.T) {
	result := &CheckResult{
		TotalSpecs:     2,
		TotalScenarios: 4,
		TotalSteps:     12,
		Gaps: []CoverageGap{
			{SpecFile: "specs/example.feature", Stem: "example"},
		},
		Duration: 20 * time.Millisecond,
	}

	textOut := FormatText(result, false, false)
	mdOut := FormatMarkdown(result)

	if textOut != mdOut {
		t.Errorf("Markdown output differs from text:\ntext: %q\nmarkdown: %q", textOut, mdOut)
	}
}

func TestFormatMarkdown_Success(t *testing.T) {
	result := &CheckResult{
		TotalSpecs:     4,
		TotalScenarios: 10,
		TotalSteps:     40,
		Gaps:           []CoverageGap{},
		Duration:       15 * time.Millisecond,
	}

	out := FormatMarkdown(result)

	if !strings.Contains(out, "✓ Spec coverage valid!") {
		t.Errorf("Expected success message, got: %q", out)
	}
}
