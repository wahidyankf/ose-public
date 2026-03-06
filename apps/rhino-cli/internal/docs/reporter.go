package docs

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/wahidyankf/open-sharia-enterprise/libs/golang-commons/timeutil"
)

// violationTypeOrder defines the display order for violation types in reports.
var violationTypeOrder = []ViolationType{
	ViolationMissingSeparator,
	ViolationWrongPrefix,
	ViolationBadCase,
	ViolationMissingPrefix,
}

// violationTypeDescriptions maps violation types to human-readable labels.
var violationTypeDescriptions = map[ViolationType]string{
	ViolationMissingSeparator: "Missing '__' separator",
	ViolationWrongPrefix:      "Wrong prefix",
	ViolationBadCase:          "Not kebab-case",
	ViolationMissingPrefix:    "Missing required prefix",
}

// FormatText formats the validation result as human-readable text.
func FormatText(result *ValidationResult, verbose, quiet bool) string {
	var output strings.Builder

	// If no violations and not quiet, show success message
	if len(result.Violations) == 0 {
		if !quiet {
			output.WriteString("✓ All documentation files follow naming conventions!\n")
			if verbose {
				_, _ = fmt.Fprintf(&output, "  Scanned %d files in %v\n", result.TotalFiles, result.ScanDuration.Round(time.Millisecond))
			}
		}
		return output.String()
	}

	// Generate violations report
	output.WriteString("# Documentation Naming Violations Report\n\n")
	_, _ = fmt.Fprintf(&output, "**Total violations**: %d\n", result.ViolationCount)
	_, _ = fmt.Fprintf(&output, "**Files scanned**: %d\n", result.TotalFiles)
	_, _ = fmt.Fprintf(&output, "**Valid files**: %d\n", result.ValidFiles)

	for _, violationType := range violationTypeOrder {
		violations, exists := result.ViolationsByType[violationType]
		if !exists || len(violations) == 0 {
			continue
		}

		_, _ = fmt.Fprintf(&output, "\n## %s (%d violations)\n", violationTypeDescriptions[violationType], len(violations))

		// Group by directory
		byDir := make(map[string][]NamingViolation)
		for _, v := range violations {
			dir := getDir(v.FilePath)
			byDir[dir] = append(byDir[dir], v)
		}

		// Sort directories alphabetically
		dirs := make([]string, 0, len(byDir))
		for dir := range byDir {
			dirs = append(dirs, dir)
		}
		sort.Strings(dirs)

		for _, dir := range dirs {
			_, _ = fmt.Fprintf(&output, "\n### %s\n\n", dir)

			dirViolations := byDir[dir]
			sort.Slice(dirViolations, func(i, j int) bool { return dirViolations[i].FileName < dirViolations[j].FileName })

			for _, v := range dirViolations {
				_, _ = fmt.Fprintf(&output, "- `%s`: %s\n", v.FileName, v.Message)
			}
		}
	}

	return output.String()
}

// getDir returns the directory part of a file path.
func getDir(filePath string) string {
	idx := strings.LastIndex(filePath, "/")
	if idx == -1 {
		return "."
	}
	return filePath[:idx]
}

// JSONOutput represents the JSON output format.
type JSONOutput struct {
	Status         string                           `json:"status"`
	Timestamp      string                           `json:"timestamp"`
	TotalFiles     int                              `json:"total_files"`
	ValidFiles     int                              `json:"valid_files"`
	ViolationCount int                              `json:"violation_count"`
	DurationMS     int64                            `json:"duration_ms"`
	ViolationTypes map[string][]JSONNamingViolation `json:"violation_types"`
}

// JSONNamingViolation represents a naming violation in JSON format.
type JSONNamingViolation struct {
	FilePath       string `json:"file_path"`
	FileName       string `json:"file_name"`
	ExpectedPrefix string `json:"expected_prefix"`
	ActualPrefix   string `json:"actual_prefix,omitempty"`
	Message        string `json:"message"`
}

// FormatJSON formats the validation result as JSON.
func FormatJSON(result *ValidationResult) (string, error) {
	status := "success"
	if len(result.Violations) > 0 {
		status = "failure"
	}

	// Build violation types map
	violationTypes := make(map[string][]JSONNamingViolation)
	for violationType, violations := range result.ViolationsByType {
		jsonViolations := make([]JSONNamingViolation, 0, len(violations))
		for _, v := range violations {
			jsonViolations = append(jsonViolations, JSONNamingViolation{
				FilePath:       v.FilePath,
				FileName:       v.FileName,
				ExpectedPrefix: v.ExpectedPrefix,
				ActualPrefix:   v.ActualPrefix,
				Message:        v.Message,
			})
		}
		violationTypes[string(violationType)] = jsonViolations
	}

	output := JSONOutput{
		Status:         status,
		Timestamp:      timeutil.Timestamp(),
		TotalFiles:     result.TotalFiles,
		ValidFiles:     result.ValidFiles,
		ViolationCount: result.ViolationCount,
		DurationMS:     result.ScanDuration.Milliseconds(),
		ViolationTypes: violationTypes,
	}

	bytes, err := json.MarshalIndent(output, "", "  ")
	if err != nil {
		return "", err
	}

	return string(bytes), nil
}

// FormatMarkdown formats the validation result as markdown.
func FormatMarkdown(result *ValidationResult) string {
	var output strings.Builder

	output.WriteString("# Documentation Naming Validation Report\n\n")
	_, _ = fmt.Fprintf(&output, "**Generated**: %s\n\n", timeutil.Timestamp())

	// Summary table
	output.WriteString("## Summary\n\n")
	output.WriteString("| Metric | Value |\n")
	output.WriteString("|--------|-------|\n")
	_, _ = fmt.Fprintf(&output, "| Total Files | %d |\n", result.TotalFiles)
	_, _ = fmt.Fprintf(&output, "| Valid Files | %d |\n", result.ValidFiles)
	_, _ = fmt.Fprintf(&output, "| Violations | %d |\n", result.ViolationCount)
	_, _ = fmt.Fprintf(&output, "| Duration | %v |\n", result.ScanDuration.Round(time.Millisecond))

	if len(result.Violations) == 0 {
		output.WriteString("\n✅ **All files follow naming conventions!**\n")
		return output.String()
	}

	output.WriteString("\n## Violations by Type\n\n")

	for _, violationType := range violationTypeOrder {
		violations, exists := result.ViolationsByType[violationType]
		if !exists || len(violations) == 0 {
			continue
		}

		_, _ = fmt.Fprintf(&output, "### %s (%d)\n\n", violationTypeDescriptions[violationType], len(violations))
		output.WriteString("| File | Expected | Actual | Message |\n")
		output.WriteString("|------|----------|--------|--------|\n")

		// Sort violations by file path
		sorted := make([]NamingViolation, len(violations))
		copy(sorted, violations)
		sort.Slice(sorted, func(i, j int) bool { return sorted[i].FilePath < sorted[j].FilePath })

		for _, v := range sorted {
			actual := v.ActualPrefix
			if actual == "" {
				actual = "(none)"
			}
			_, _ = fmt.Fprintf(&output, "| `%s` | `%s` | `%s` | %s |\n",
				v.FilePath, v.ExpectedPrefix, actual, v.Message)
		}
		output.WriteString("\n")
	}

	return output.String()
}

// FormatFixPlan formats the fix plan for display (dry-run mode).
func FormatFixPlan(result *FixResult) string {
	var output strings.Builder

	output.WriteString("# Documentation Naming Fix Plan\n\n")

	if len(result.RenameOperations) == 0 {
		output.WriteString("✓ No files need to be renamed.\n")
		return output.String()
	}

	// Files to rename
	_, _ = fmt.Fprintf(&output, "## Files to Rename (%d)\n\n", len(result.RenameOperations))
	output.WriteString("| Current Name | New Name | Directory |\n")
	output.WriteString("|--------------|----------|----------|\n")

	// Sort by path for consistent output
	ops := make([]RenameOperation, len(result.RenameOperations))
	copy(ops, result.RenameOperations)
	sort.Slice(ops, func(i, j int) bool { return ops[i].OldPath < ops[j].OldPath })

	for _, op := range ops {
		dir := getDir(op.OldPath)
		_, _ = fmt.Fprintf(&output, "| `%s` | `%s` | %s |\n", op.OldName, op.NewName, dir)
	}

	// Links to update
	if len(result.LinkUpdates) > 0 {
		_, _ = fmt.Fprintf(&output, "\n## Links to Update (%d)\n\n", len(result.LinkUpdates))
		output.WriteString("| File | Line | Current Link | New Link |\n")
		output.WriteString("|------|------|--------------|----------|\n")

		// Sort by file and line number
		updates := make([]LinkUpdate, len(result.LinkUpdates))
		copy(updates, result.LinkUpdates)
		sort.Slice(updates, func(i, j int) bool {
			if updates[i].FilePath != updates[j].FilePath {
				return updates[i].FilePath < updates[j].FilePath
			}
			return updates[i].LineNumber < updates[j].LineNumber
		})

		for _, u := range updates {
			_, _ = fmt.Fprintf(&output, "| %s | %d | `%s` | `%s` |\n",
				u.FilePath, u.LineNumber, u.OldLink, u.NewLink)
		}
	}

	output.WriteString("\n---\n")
	output.WriteString("Run with `--apply` to execute these changes.\n")

	return output.String()
}

// FormatFixResult formats the result after applying fixes.
func FormatFixResult(result *FixResult) string {
	var output strings.Builder

	output.WriteString("# Documentation Naming Fix Results\n\n")

	// Summary
	if result.RenamesApplied > 0 {
		_, _ = fmt.Fprintf(&output, "✓ Renamed %d files\n", result.RenamesApplied)
	}
	if result.LinksUpdated > 0 {
		_, _ = fmt.Fprintf(&output, "✓ Updated %d links\n", result.LinksUpdated)
	}

	// Errors
	if len(result.Errors) > 0 {
		_, _ = fmt.Fprintf(&output, "\n## Errors (%d)\n\n", len(result.Errors))
		for _, err := range result.Errors {
			_, _ = fmt.Fprintf(&output, "- %s\n", err)
		}
	}

	// Details
	if result.RenamesApplied > 0 {
		output.WriteString("\n## Renamed Files\n\n")
		for _, op := range result.RenameOperations {
			_, _ = fmt.Fprintf(&output, "- `%s` → `%s`\n", op.OldPath, op.NewPath)
		}
	}

	return output.String()
}

// FixJSONOutput represents the JSON output format for fix operations.
type FixJSONOutput struct {
	Status           string           `json:"status"`
	Timestamp        string           `json:"timestamp"`
	DryRun           bool             `json:"dry_run"`
	RenameCount      int              `json:"rename_count"`
	LinkUpdateCount  int              `json:"link_update_count"`
	RenamesApplied   int              `json:"renames_applied,omitempty"`
	LinksUpdated     int              `json:"links_updated,omitempty"`
	RenameOperations []JSONRenameOp   `json:"rename_operations"`
	LinkUpdates      []JSONLinkUpdate `json:"link_updates,omitempty"`
	Errors           []string         `json:"errors,omitempty"`
}

// JSONRenameOp represents a rename operation in JSON format.
type JSONRenameOp struct {
	OldPath string `json:"old_path"`
	NewPath string `json:"new_path"`
	OldName string `json:"old_name"`
	NewName string `json:"new_name"`
}

// JSONLinkUpdate represents a link update in JSON format.
type JSONLinkUpdate struct {
	FilePath   string `json:"file_path"`
	LineNumber int    `json:"line_number"`
	OldLink    string `json:"old_link"`
	NewLink    string `json:"new_link"`
}

// FormatFixJSON formats the fix result as JSON.
func FormatFixJSON(result *FixResult) (string, error) {
	status := "success"
	if len(result.Errors) > 0 {
		status = "partial"
	}

	ops := make([]JSONRenameOp, len(result.RenameOperations))
	for i, op := range result.RenameOperations {
		ops[i] = JSONRenameOp(op)
	}

	updates := make([]JSONLinkUpdate, len(result.LinkUpdates))
	for i, u := range result.LinkUpdates {
		updates[i] = JSONLinkUpdate(u)
	}

	output := FixJSONOutput{
		Status:           status,
		Timestamp:        timeutil.Timestamp(),
		DryRun:           result.DryRun,
		RenameCount:      len(result.RenameOperations),
		LinkUpdateCount:  len(result.LinkUpdates),
		RenamesApplied:   result.RenamesApplied,
		LinksUpdated:     result.LinksUpdated,
		RenameOperations: ops,
		LinkUpdates:      updates,
		Errors:           result.Errors,
	}

	bytes, err := json.MarshalIndent(output, "", "  ")
	if err != nil {
		return "", err
	}

	return string(bytes), nil
}
