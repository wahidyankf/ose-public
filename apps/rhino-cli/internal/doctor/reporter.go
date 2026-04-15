package doctor

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/wahidyankf/ose-public/libs/golang-commons/timeutil"
)

func symbolFor(status ToolStatus) string {
	switch status {
	case StatusOK:
		return "✓"
	case StatusWarning:
		return "⚠"
	case StatusMissing:
		return "✗"
	default:
		return "?"
	}
}

func displayVersion(check ToolCheck) string {
	if check.Status == StatusMissing {
		return "not found"
	}
	if check.InstalledVersion == "" {
		return "(unknown)"
	}
	return "v" + check.InstalledVersion
}

func overallStatus(result *DoctorResult) string {
	if result.MissingCount > 0 {
		return "missing"
	}
	if result.WarnCount > 0 {
		return "warning"
	}
	return "ok"
}

// FormatText formats the doctor result as human-readable text.
func FormatText(result *DoctorResult, verbose, quiet bool) string {
	var sb strings.Builder

	if !quiet {
		sb.WriteString("Doctor Report\n")
		sb.WriteString("=============\n\n")
	}

	for _, check := range result.Checks {
		sym := symbolFor(check.Status)
		ver := displayVersion(check)
		_, _ = fmt.Fprintf(&sb, "%s %-10s %-14s (%s)\n", sym, check.Name, ver, check.Note)
	}

	total := result.OKCount + result.WarnCount + result.MissingCount
	summary := fmt.Sprintf("\nSummary: %d/%d tools OK, %d warning, %d missing",
		result.OKCount, total, result.WarnCount, result.MissingCount)
	if result.Scope == ScopeMinimal {
		summary += " (scope: minimal)"
	}
	sb.WriteString(summary + "\n")

	if verbose {
		_, _ = fmt.Fprintf(&sb, "Duration: %v\n", result.Duration.Round(time.Millisecond))
	}

	return sb.String()
}

// JSONToolItem represents a single tool check in JSON output.
type JSONToolItem struct {
	Name             string `json:"name"`
	Binary           string `json:"binary"`
	Status           string `json:"status"`
	InstalledVersion string `json:"installed_version,omitempty"`
	RequiredVersion  string `json:"required_version,omitempty"`
	Source           string `json:"source,omitempty"`
	Note             string `json:"note,omitempty"`
}

// JSONOutput represents the JSON output format for doctor results.
type JSONOutput struct {
	Status       string         `json:"status"`
	Scope        string         `json:"scope,omitempty"`
	Timestamp    string         `json:"timestamp"`
	OKCount      int            `json:"ok_count"`
	WarnCount    int            `json:"warn_count"`
	MissingCount int            `json:"missing_count"`
	DurationMS   int64          `json:"duration_ms"`
	Tools        []JSONToolItem `json:"tools"`
}

// FormatJSON formats the doctor result as JSON.
func FormatJSON(result *DoctorResult) (string, error) {
	tools := make([]JSONToolItem, len(result.Checks))
	for i, check := range result.Checks {
		tools[i] = JSONToolItem{
			Name:             check.Name,
			Binary:           check.Binary,
			Status:           string(check.Status),
			InstalledVersion: check.InstalledVersion,
			RequiredVersion:  check.RequiredVersion,
			Source:           check.Source,
			Note:             check.Note,
		}
	}

	out := JSONOutput{
		Status:       overallStatus(result),
		Scope:        string(result.Scope),
		Timestamp:    timeutil.Timestamp(),
		OKCount:      result.OKCount,
		WarnCount:    result.WarnCount,
		MissingCount: result.MissingCount,
		DurationMS:   result.Duration.Milliseconds(),
		Tools:        tools,
	}

	b, err := json.MarshalIndent(out, "", "  ")
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// FormatMarkdown formats the doctor result as a markdown report.
func FormatMarkdown(result *DoctorResult) string {
	var sb strings.Builder

	sb.WriteString("## Doctor Report\n\n")
	_, _ = fmt.Fprintf(&sb, "**Generated**: %s\n\n", timeutil.Timestamp())

	total := result.OKCount + result.WarnCount + result.MissingCount
	sb.WriteString("### Summary\n\n")
	sb.WriteString("| Metric | Value |\n")
	sb.WriteString("|--------|-------|\n")
	_, _ = fmt.Fprintf(&sb, "| OK | %d |\n", result.OKCount)
	_, _ = fmt.Fprintf(&sb, "| Warning | %d |\n", result.WarnCount)
	_, _ = fmt.Fprintf(&sb, "| Missing | %d |\n", result.MissingCount)
	_, _ = fmt.Fprintf(&sb, "| Total | %d |\n", total)
	sb.WriteString("\n")

	sb.WriteString("### Tools\n\n")
	sb.WriteString("| Tool | Status | Installed | Required | Note |\n")
	sb.WriteString("|------|--------|-----------|----------|------|\n")

	for _, check := range result.Checks {
		sym := symbolFor(check.Status)
		ver := displayVersion(check)
		_, _ = fmt.Fprintf(&sb, "| %s | %s %s | %s | %s | %s |\n",
			check.Name, sym, string(check.Status), ver, check.RequiredVersion, check.Note)
	}

	return sb.String()
}
