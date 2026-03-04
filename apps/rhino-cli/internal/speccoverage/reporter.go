package speccoverage

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/wahidyankf/open-sharia-enterprise/libs/golang-commons/timeutil"
)

// FormatText formats the check result as human-readable text.
func FormatText(result *CheckResult, verbose, quiet bool) string {
	var out strings.Builder

	hasGaps := len(result.Gaps) > 0 || len(result.ScenarioGaps) > 0 || len(result.StepGaps) > 0

	if !hasGaps {
		if !quiet {
			_, _ = fmt.Fprintf(&out, "✓ Spec coverage valid! %d specs, %d scenarios, %d steps — all covered.\n",
				result.TotalSpecs, result.TotalScenarios, result.TotalSteps)
		}
		return out.String()
	}

	_, _ = fmt.Fprintf(&out, "✗ Spec coverage gaps found!\n\n")

	if len(result.Gaps) > 0 {
		_, _ = fmt.Fprintf(&out, "Missing test files (%d):\n", len(result.Gaps))
		for _, gap := range result.Gaps {
			_, _ = fmt.Fprintf(&out, "  - %s\n    (expected test file with stem: %s)\n", gap.SpecFile, gap.Stem)
		}
	}

	if len(result.ScenarioGaps) > 0 {
		if len(result.Gaps) > 0 {
			_, _ = fmt.Fprintln(&out)
		}
		_, _ = fmt.Fprintf(&out, "Missing scenarios (%d):\n", len(result.ScenarioGaps))
		for _, sg := range result.ScenarioGaps {
			_, _ = fmt.Fprintf(&out, "  - %s\n    → Scenario: %q\n", sg.SpecFile, sg.ScenarioTitle)
		}
	}

	if len(result.StepGaps) > 0 {
		if len(result.Gaps) > 0 || len(result.ScenarioGaps) > 0 {
			_, _ = fmt.Fprintln(&out)
		}
		_, _ = fmt.Fprintf(&out, "Missing steps (%d):\n", len(result.StepGaps))

		// Group by (SpecFile, ScenarioTitle) for readability
		type key struct{ spec, scenario string }
		order := []key{}
		groups := map[key][]StepGap{}
		for _, sg := range result.StepGaps {
			k := key{sg.SpecFile, sg.ScenarioTitle}
			if _, exists := groups[k]; !exists {
				order = append(order, k)
			}
			groups[k] = append(groups[k], sg)
		}
		for _, k := range order {
			_, _ = fmt.Fprintf(&out, "  - %s\n    → Scenario: %q\n", k.spec, k.scenario)
			for _, sg := range groups[k] {
				_, _ = fmt.Fprintf(&out, "      · %s %s\n", sg.StepKeyword, sg.StepText)
			}
		}
	}

	return out.String()
}

// JSONOutput represents the JSON output format for spec coverage.
type JSONOutput struct {
	Status           string        `json:"status"`
	Timestamp        string        `json:"timestamp"`
	TotalSpecs       int           `json:"total_specs"`
	TotalScenarios   int           `json:"total_scenarios"`
	TotalSteps       int           `json:"total_steps"`
	GapCount         int           `json:"gap_count"`
	ScenarioGapCount int           `json:"scenario_gap_count"`
	StepGapCount     int           `json:"step_gap_count"`
	DurationMS       int64         `json:"duration_ms"`
	Gaps             []JSONGap     `json:"gaps"`
	ScenarioGaps     []JSONScenGap `json:"scenario_gaps"`
	StepGaps         []JSONStepGap `json:"step_gaps"`
}

// JSONGap represents a single file-level coverage gap in JSON output.
type JSONGap struct {
	SpecFile string `json:"spec_file"`
	Stem     string `json:"stem"`
}

// JSONScenGap represents a scenario-level gap in JSON output.
type JSONScenGap struct {
	SpecFile      string `json:"spec_file"`
	ScenarioTitle string `json:"scenario_title"`
}

// JSONStepGap represents a step-level gap in JSON output.
type JSONStepGap struct {
	SpecFile      string `json:"spec_file"`
	ScenarioTitle string `json:"scenario_title"`
	Keyword       string `json:"keyword"`
	StepText      string `json:"step_text"`
}

// FormatJSON formats the check result as JSON.
func FormatJSON(result *CheckResult) (string, error) {
	status := "success"
	if len(result.Gaps) > 0 || len(result.ScenarioGaps) > 0 || len(result.StepGaps) > 0 {
		status = "failure"
	}

	gaps := make([]JSONGap, 0, len(result.Gaps))
	for _, g := range result.Gaps {
		gaps = append(gaps, JSONGap(g))
	}

	scenGaps := make([]JSONScenGap, 0, len(result.ScenarioGaps))
	for _, sg := range result.ScenarioGaps {
		scenGaps = append(scenGaps, JSONScenGap(sg))
	}

	stepGaps := make([]JSONStepGap, 0, len(result.StepGaps))
	for _, sg := range result.StepGaps {
		stepGaps = append(stepGaps, JSONStepGap{
			SpecFile:      sg.SpecFile,
			ScenarioTitle: sg.ScenarioTitle,
			Keyword:       sg.StepKeyword,
			StepText:      sg.StepText,
		})
	}

	out := JSONOutput{
		Status:           status,
		Timestamp:        timeutil.Timestamp(),
		TotalSpecs:       result.TotalSpecs,
		TotalScenarios:   result.TotalScenarios,
		TotalSteps:       result.TotalSteps,
		GapCount:         len(result.Gaps),
		ScenarioGapCount: len(result.ScenarioGaps),
		StepGapCount:     len(result.StepGaps),
		DurationMS:       result.Duration.Milliseconds(),
		Gaps:             gaps,
		ScenarioGaps:     scenGaps,
		StepGaps:         stepGaps,
	}

	bytes, err := json.MarshalIndent(out, "", "  ")
	if err != nil {
		return "", err
	}

	return string(bytes), nil
}

// FormatMarkdown formats the check result as markdown (same as text).
func FormatMarkdown(result *CheckResult) string {
	return FormatText(result, false, false)
}
