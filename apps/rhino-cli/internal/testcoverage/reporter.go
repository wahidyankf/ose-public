package testcoverage

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"github.com/wahidyankf/ose-public/libs/golang-commons/timeutil"
)

// FormatText returns a human-readable coverage report matching the Python script output exactly.
// Text output format:
//
//	"Line coverage: 86.08% (2411 covered, 141 partial, 249 missed, 2801 total)"
//	"PASS: 86.08% >= 85% threshold"  (or FAIL)
func FormatText(r *Result, _, _ bool) string {
	var out strings.Builder
	_, _ = fmt.Fprintf(&out, "Line coverage: %.2f%% (%d covered, %d partial, %d missed, %d total)\n",
		r.Pct, r.Covered, r.Partial, r.Missed, r.Total)
	if r.Passed {
		_, _ = fmt.Fprintf(&out, "PASS: %.2f%% >= %.0f%% threshold\n", r.Pct, r.Threshold)
	} else {
		_, _ = fmt.Fprintf(&out, "FAIL: %.2f%% < %.0f%% threshold\n", r.Pct, r.Threshold)
	}
	return out.String()
}

// FormatTextPerFile returns a human-readable per-file coverage breakdown.
// Files are sorted ascending by coverage percentage (worst first).
func FormatTextPerFile(r *Result, belowThreshold float64) string {
	files := filterAndSortFiles(r.Files, belowThreshold)
	if len(files) == 0 {
		return "No files to report.\n"
	}
	var out strings.Builder
	_, _ = fmt.Fprintf(&out, "\nPer-file coverage (%d files):\n", len(files))
	for _, f := range files {
		_, _ = fmt.Fprintf(&out, "  %6.2f%%  %s (%d covered, %d partial, %d missed)\n",
			f.Pct, f.Path, f.Covered, f.Partial, f.Missed)
	}
	return out.String()
}

// filterAndSortFiles returns files sorted ascending by Pct, optionally filtered to those below threshold.
func filterAndSortFiles(files []FileResult, belowThreshold float64) []FileResult {
	var result []FileResult
	for _, f := range files {
		if belowThreshold > 0 && f.Pct >= belowThreshold {
			continue
		}
		result = append(result, f)
	}
	sort.Slice(result, func(i, j int) bool { return result[i].Pct < result[j].Pct })
	return result
}

// jsonOutput represents the JSON output for coverage results.
type jsonOutput struct {
	Status    string       `json:"status"`
	Timestamp string       `json:"timestamp"`
	File      string       `json:"file"`
	Format    string       `json:"format"`
	Covered   int          `json:"covered"`
	Partial   int          `json:"partial"`
	Missed    int          `json:"missed"`
	Total     int          `json:"total"`
	Pct       float64      `json:"pct"`
	Threshold float64      `json:"threshold"`
	Passed    bool         `json:"passed"`
	Files     []FileResult `json:"files,omitempty"`
}

// FormatJSON returns a JSON coverage report.
// If perFile is true, includes per-file breakdown. belowThreshold filters files (0 = no filter).
func FormatJSON(r *Result, perFile bool, belowThreshold float64) (string, error) {
	status := "success"
	if !r.Passed {
		status = "failure"
	}

	out := jsonOutput{
		Status:    status,
		Timestamp: timeutil.Timestamp(),
		File:      r.File,
		Format:    string(r.Format),
		Covered:   r.Covered,
		Partial:   r.Partial,
		Missed:    r.Missed,
		Total:     r.Total,
		Pct:       r.Pct,
		Threshold: r.Threshold,
		Passed:    r.Passed,
	}
	if perFile && len(r.Files) > 0 {
		out.Files = filterAndSortFiles(r.Files, belowThreshold)
	}

	b, err := json.MarshalIndent(out, "", "  ")
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// FormatMarkdown returns a markdown coverage report.
// If perFile is true, appends a per-file table. belowThreshold filters files (0 = no filter).
func FormatMarkdown(r *Result, perFile bool, belowThreshold float64) string {
	status := "PASS"
	if !r.Passed {
		status = "FAIL"
	}

	out := fmt.Sprintf(
		"## Coverage Report\n\n"+
			"| Metric | Value |\n"+
			"| --- | --- |\n"+
			"| File | %s |\n"+
			"| Format | %s |\n"+
			"| Line Coverage | %.2f%% |\n"+
			"| Threshold | %.0f%% |\n"+
			"| Covered | %d |\n"+
			"| Partial | %d |\n"+
			"| Missed | %d |\n"+
			"| Total | %d |\n"+
			"| Status | **%s** |\n",
		r.File, string(r.Format), r.Pct, r.Threshold,
		r.Covered, r.Partial, r.Missed, r.Total, status,
	)

	if perFile && len(r.Files) > 0 {
		files := filterAndSortFiles(r.Files, belowThreshold)
		if len(files) > 0 {
			out += "\n### Per-File Breakdown\n\n"
			out += "| Coverage | File | Covered | Partial | Missed |\n"
			out += "| --- | --- | --- | --- | --- |\n"
			for _, f := range files {
				out += fmt.Sprintf("| %.2f%% | %s | %d | %d | %d |\n",
					f.Pct, f.Path, f.Covered, f.Partial, f.Missed)
			}
		}
	}

	return out
}
