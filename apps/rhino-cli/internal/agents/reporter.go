package agents

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/wahidyankf/ose-public/libs/golang-commons/timeutil"
)

// ---- Sync formatting ----

// FormatSyncText formats sync results as plain text.
func FormatSyncText(result *SyncResult, verbose, quiet bool) string {
	var sb strings.Builder

	if !quiet {
		sb.WriteString("Sync Complete\n")
		sb.WriteString(strings.Repeat("=", 50) + "\n\n")
	}

	_, _ = fmt.Fprintf(&sb, "Agents: %d converted", result.AgentsConverted)
	if result.AgentsFailed > 0 {
		_, _ = fmt.Fprintf(&sb, ", %d failed", result.AgentsFailed)
	}
	sb.WriteString("\n")

	_, _ = fmt.Fprintf(&sb, "Skills: %d copied", result.SkillsCopied)
	if result.SkillsFailed > 0 {
		_, _ = fmt.Fprintf(&sb, ", %d failed", result.SkillsFailed)
	}
	sb.WriteString("\n")

	_, _ = fmt.Fprintf(&sb, "Duration: %v\n", result.Duration)

	if len(result.FailedFiles) > 0 {
		sb.WriteString("\nFailed Files:\n")
		for _, file := range result.FailedFiles {
			_, _ = fmt.Fprintf(&sb, "  - %s\n", file)
		}
	}

	if !quiet {
		sb.WriteString("\n")
		if len(result.FailedFiles) > 0 {
			sb.WriteString("Status: ❌ FAILED\n")
		} else {
			sb.WriteString("Status: ✓ SUCCESS\n")
		}
	}

	return sb.String()
}

// syncJSONOutput represents the JSON output format for sync results.
type syncJSONOutput struct {
	Status          string   `json:"status"`
	Timestamp       string   `json:"timestamp"`
	AgentsConverted int      `json:"agents_converted"`
	AgentsFailed    int      `json:"agents_failed"`
	SkillsCopied    int      `json:"skills_copied"`
	SkillsFailed    int      `json:"skills_failed"`
	FailedFiles     []string `json:"failed_files"`
	DurationMS      int64    `json:"duration_ms"`
}

// FormatSyncJSON formats sync results as JSON.
func FormatSyncJSON(result *SyncResult) (string, error) {
	status := "success"
	if len(result.FailedFiles) > 0 {
		status = "failure"
	}

	failedFiles := result.FailedFiles
	if failedFiles == nil {
		failedFiles = []string{}
	}

	out := syncJSONOutput{
		Status:          status,
		Timestamp:       timeutil.Timestamp(),
		AgentsConverted: result.AgentsConverted,
		AgentsFailed:    result.AgentsFailed,
		SkillsCopied:    result.SkillsCopied,
		SkillsFailed:    result.SkillsFailed,
		FailedFiles:     failedFiles,
		DurationMS:      result.Duration.Milliseconds(),
	}

	data, err := json.MarshalIndent(out, "", "  ")
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// FormatSyncMarkdown formats sync results as markdown.
func FormatSyncMarkdown(result *SyncResult) string {
	var sb strings.Builder

	sb.WriteString("# Sync Results\n\n")

	sb.WriteString("## Summary\n\n")
	_, _ = fmt.Fprintf(&sb, "- **Agents Converted**: %d\n", result.AgentsConverted)
	if result.AgentsFailed > 0 {
		_, _ = fmt.Fprintf(&sb, "- **Agents Failed**: %d\n", result.AgentsFailed)
	}
	_, _ = fmt.Fprintf(&sb, "- **Skills Copied**: %d\n", result.SkillsCopied)
	if result.SkillsFailed > 0 {
		_, _ = fmt.Fprintf(&sb, "- **Skills Failed**: %d\n", result.SkillsFailed)
	}
	_, _ = fmt.Fprintf(&sb, "- **Duration**: %v\n\n", result.Duration)

	if len(result.FailedFiles) > 0 {
		sb.WriteString("## Failed Files\n\n")
		for _, file := range result.FailedFiles {
			_, _ = fmt.Fprintf(&sb, "- `%s`\n", file)
		}
		sb.WriteString("\n")
	}

	if len(result.FailedFiles) > 0 {
		sb.WriteString("**Status**: ❌ FAILED\n")
	} else {
		sb.WriteString("**Status**: ✓ SUCCESS\n")
	}

	return sb.String()
}

// ---- Validation formatting ----

// validationStatusBanner returns the human-readable status string for a
// validation run. FailedChecks > 0 → FAILED; else WarningChecks > 0 →
// PASSED WITH WARNINGS; else PASSED.
func validationStatusBanner(result *ValidationResult) string {
	switch {
	case result.FailedChecks > 0:
		return "❌ VALIDATION FAILED"
	case result.WarningChecks > 0:
		return "⚠ VALIDATION PASSED WITH WARNINGS"
	default:
		return "✓ VALIDATION PASSED"
	}
}

// validationStatusJSON returns the machine-readable status string for the
// JSON formatter. Mirrors validationStatusBanner without decoration.
func validationStatusJSON(result *ValidationResult) string {
	switch {
	case result.FailedChecks > 0:
		return "failure"
	case result.WarningChecks > 0:
		return "warning"
	default:
		return "success"
	}
}

// FormatValidationText formats validation results as plain text.
func FormatValidationText(result *ValidationResult, verbose, quiet bool) string {
	var sb strings.Builder

	if !quiet {
		sb.WriteString("Validation Complete\n")
		sb.WriteString(strings.Repeat("=", 50) + "\n\n")
	}

	_, _ = fmt.Fprintf(&sb, "Total Checks: %d\n", result.TotalChecks)
	_, _ = fmt.Fprintf(&sb, "Passed: %d\n", result.PassedChecks)
	if result.WarningChecks > 0 {
		_, _ = fmt.Fprintf(&sb, "Warnings: %d\n", result.WarningChecks)
	}
	_, _ = fmt.Fprintf(&sb, "Failed: %d\n", result.FailedChecks)
	_, _ = fmt.Fprintf(&sb, "Duration: %v\n", result.Duration)

	if result.FailedChecks > 0 {
		sb.WriteString("\nFailed Checks:\n")
		for _, check := range result.Checks {
			if check.Status == "failed" {
				_, _ = fmt.Fprintf(&sb, "\n  ❌ %s\n", check.Name)
				if check.Expected != "" {
					_, _ = fmt.Fprintf(&sb, "     Expected: %s\n", check.Expected)
				}
				if check.Actual != "" {
					_, _ = fmt.Fprintf(&sb, "     Actual: %s\n", check.Actual)
				}
				if check.Message != "" {
					_, _ = fmt.Fprintf(&sb, "     Message: %s\n", check.Message)
				}
			}
		}
	}

	if result.WarningChecks > 0 {
		sb.WriteString("\nWarnings:\n")
		for _, check := range result.Checks {
			if check.Status == "warning" {
				_, _ = fmt.Fprintf(&sb, "\n  ⚠ %s\n", check.Name)
				if check.Expected != "" {
					_, _ = fmt.Fprintf(&sb, "     Expected: %s\n", check.Expected)
				}
				if check.Actual != "" {
					_, _ = fmt.Fprintf(&sb, "     Actual: %s\n", check.Actual)
				}
				if check.Message != "" {
					_, _ = fmt.Fprintf(&sb, "     Message: %s\n", check.Message)
				}
			}
		}
	}

	if verbose {
		sb.WriteString("\nAll Checks:\n")
		for _, check := range result.Checks {
			switch check.Status {
			case "passed":
				_, _ = fmt.Fprintf(&sb, "  ✓ %s\n", check.Name)
			case "warning":
				_, _ = fmt.Fprintf(&sb, "  ⚠ %s\n", check.Name)
			default:
				_, _ = fmt.Fprintf(&sb, "  ❌ %s\n", check.Name)
			}
			if verbose && check.Message != "" {
				_, _ = fmt.Fprintf(&sb, "     %s\n", check.Message)
			}
		}
	}

	if !quiet {
		sb.WriteString("\n")
		_, _ = fmt.Fprintf(&sb, "Status: %s\n", validationStatusBanner(result))
	}

	return sb.String()
}

// validationJSONOutput represents the JSON output format for validation results.
type validationJSONOutput struct {
	Status        string                `json:"status"`
	Timestamp     string                `json:"timestamp"`
	TotalChecks   int                   `json:"total_checks"`
	PassedChecks  int                   `json:"passed_checks"`
	WarningChecks int                   `json:"warning_checks"`
	FailedChecks  int                   `json:"failed_checks"`
	DurationMS    int64                 `json:"duration_ms"`
	Checks        []validationJSONCheck `json:"checks"`
}

// validationJSONCheck represents a single validation check in JSON format.
type validationJSONCheck struct {
	Name     string `json:"name"`
	Status   string `json:"status"`
	Expected string `json:"expected,omitempty"`
	Actual   string `json:"actual,omitempty"`
	Message  string `json:"message,omitempty"`
}

// FormatValidationJSON formats validation results as JSON.
func FormatValidationJSON(result *ValidationResult) (string, error) {
	checks := make([]validationJSONCheck, 0, len(result.Checks))
	for _, c := range result.Checks {
		checks = append(checks, validationJSONCheck(c))
	}

	out := validationJSONOutput{
		Status:        validationStatusJSON(result),
		Timestamp:     timeutil.Timestamp(),
		TotalChecks:   result.TotalChecks,
		PassedChecks:  result.PassedChecks,
		WarningChecks: result.WarningChecks,
		FailedChecks:  result.FailedChecks,
		DurationMS:    result.Duration.Milliseconds(),
		Checks:        checks,
	}

	data, err := json.MarshalIndent(out, "", "  ")
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// FormatValidationMarkdown formats validation results as markdown.
func FormatValidationMarkdown(result *ValidationResult, verbose bool) string {
	var sb strings.Builder

	sb.WriteString("# Validation Results\n\n")

	sb.WriteString("## Summary\n\n")
	_, _ = fmt.Fprintf(&sb, "- **Total Checks**: %d\n", result.TotalChecks)
	_, _ = fmt.Fprintf(&sb, "- **Passed**: %d\n", result.PassedChecks)
	if result.WarningChecks > 0 {
		_, _ = fmt.Fprintf(&sb, "- **Warnings**: %d\n", result.WarningChecks)
	}
	_, _ = fmt.Fprintf(&sb, "- **Failed**: %d\n", result.FailedChecks)
	_, _ = fmt.Fprintf(&sb, "- **Duration**: %v\n\n", result.Duration)

	if result.FailedChecks > 0 {
		sb.WriteString("## Failed Checks\n\n")
		for _, check := range result.Checks {
			if check.Status == "failed" {
				_, _ = fmt.Fprintf(&sb, "### ❌ %s\n\n", check.Name)
				if check.Expected != "" {
					_, _ = fmt.Fprintf(&sb, "- **Expected**: %s\n", check.Expected)
				}
				if check.Actual != "" {
					_, _ = fmt.Fprintf(&sb, "- **Actual**: %s\n", check.Actual)
				}
				if check.Message != "" {
					_, _ = fmt.Fprintf(&sb, "- **Message**: %s\n", check.Message)
				}
				sb.WriteString("\n")
			}
		}
	}

	if result.WarningChecks > 0 {
		sb.WriteString("## Warnings\n\n")
		for _, check := range result.Checks {
			if check.Status == "warning" {
				_, _ = fmt.Fprintf(&sb, "### ⚠ %s\n\n", check.Name)
				if check.Expected != "" {
					_, _ = fmt.Fprintf(&sb, "- **Expected**: %s\n", check.Expected)
				}
				if check.Actual != "" {
					_, _ = fmt.Fprintf(&sb, "- **Actual**: %s\n", check.Actual)
				}
				if check.Message != "" {
					_, _ = fmt.Fprintf(&sb, "- **Message**: %s\n", check.Message)
				}
				sb.WriteString("\n")
			}
		}
	}

	if verbose {
		sb.WriteString("## All Checks\n\n")
		for _, check := range result.Checks {
			switch check.Status {
			case "passed":
				_, _ = fmt.Fprintf(&sb, "- ✓ %s", check.Name)
			case "warning":
				_, _ = fmt.Fprintf(&sb, "- ⚠ %s", check.Name)
			default:
				_, _ = fmt.Fprintf(&sb, "- ❌ %s", check.Name)
			}
			if check.Message != "" {
				_, _ = fmt.Fprintf(&sb, " - %s", check.Message)
			}
			sb.WriteString("\n")
		}
		sb.WriteString("\n")
	}

	_, _ = fmt.Fprintf(&sb, "**Status**: %s\n", validationStatusBanner(result))

	return sb.String()
}
