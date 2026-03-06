package agents

import (
	"encoding/json"
	"fmt"
	"strings"
)

// FormatSyncResult formats sync results for output
func FormatSyncResult(result *SyncResult, format string, quiet bool) string {
	switch format {
	case "json":
		return formatSyncResultJSON(result)
	case "markdown":
		return formatSyncResultMarkdown(result)
	default:
		return formatSyncResultText(result, quiet)
	}
}

// formatSyncResultText formats sync results as plain text
func formatSyncResultText(result *SyncResult, quiet bool) string {
	var sb strings.Builder

	if !quiet {
		sb.WriteString("Sync Complete\n")
		sb.WriteString(strings.Repeat("=", 50) + "\n\n")
	}

	// Summary
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

	// Failed files
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

// formatSyncResultJSON formats sync results as JSON
func formatSyncResultJSON(result *SyncResult) string {
	data, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		return fmt.Sprintf(`{"error": "failed to marshal JSON: %v"}`, err)
	}
	return string(data)
}

// formatSyncResultMarkdown formats sync results as markdown
func formatSyncResultMarkdown(result *SyncResult) string {
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

// FormatValidationResult formats validation results for output
func FormatValidationResult(result *ValidationResult, format string, verbose bool, quiet bool) string {
	switch format {
	case "json":
		return formatValidationResultJSON(result)
	case "markdown":
		return formatValidationResultMarkdown(result, verbose)
	default:
		return formatValidationResultText(result, verbose, quiet)
	}
}

// formatValidationResultText formats validation results as plain text
func formatValidationResultText(result *ValidationResult, verbose bool, quiet bool) string {
	var sb strings.Builder

	if !quiet {
		sb.WriteString("Validation Complete\n")
		sb.WriteString(strings.Repeat("=", 50) + "\n\n")
	}

	// Summary
	_, _ = fmt.Fprintf(&sb, "Total Checks: %d\n", result.TotalChecks)
	_, _ = fmt.Fprintf(&sb, "Passed: %d\n", result.PassedChecks)
	_, _ = fmt.Fprintf(&sb, "Failed: %d\n", result.FailedChecks)
	_, _ = fmt.Fprintf(&sb, "Duration: %v\n", result.Duration)

	// Show failed checks
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

	// Show all checks in verbose mode
	if verbose {
		sb.WriteString("\nAll Checks:\n")
		for _, check := range result.Checks {
			if check.Status == "passed" {
				_, _ = fmt.Fprintf(&sb, "  ✓ %s\n", check.Name)
			} else {
				_, _ = fmt.Fprintf(&sb, "  ❌ %s\n", check.Name)
			}
			if verbose && check.Message != "" {
				_, _ = fmt.Fprintf(&sb, "     %s\n", check.Message)
			}
		}
	}

	if !quiet {
		sb.WriteString("\n")
		if result.FailedChecks > 0 {
			sb.WriteString("Status: ❌ VALIDATION FAILED\n")
		} else {
			sb.WriteString("Status: ✓ VALIDATION PASSED\n")
		}
	}

	return sb.String()
}

// formatValidationResultJSON formats validation results as JSON
func formatValidationResultJSON(result *ValidationResult) string {
	data, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		return fmt.Sprintf(`{"error": "failed to marshal JSON: %v"}`, err)
	}
	return string(data)
}

// formatValidationResultMarkdown formats validation results as markdown
func formatValidationResultMarkdown(result *ValidationResult, verbose bool) string {
	var sb strings.Builder

	sb.WriteString("# Validation Results\n\n")

	sb.WriteString("## Summary\n\n")
	_, _ = fmt.Fprintf(&sb, "- **Total Checks**: %d\n", result.TotalChecks)
	_, _ = fmt.Fprintf(&sb, "- **Passed**: %d\n", result.PassedChecks)
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

	if verbose {
		sb.WriteString("## All Checks\n\n")
		for _, check := range result.Checks {
			if check.Status == "passed" {
				_, _ = fmt.Fprintf(&sb, "- ✓ %s", check.Name)
			} else {
				_, _ = fmt.Fprintf(&sb, "- ❌ %s", check.Name)
			}
			if check.Message != "" {
				_, _ = fmt.Fprintf(&sb, " - %s", check.Message)
			}
			sb.WriteString("\n")
		}
		sb.WriteString("\n")
	}

	if result.FailedChecks > 0 {
		sb.WriteString("**Status**: ❌ VALIDATION FAILED\n")
	} else {
		sb.WriteString("**Status**: ✓ VALIDATION PASSED\n")
	}

	return sb.String()
}
