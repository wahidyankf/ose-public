package testcoverage

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/wahidyankf/open-sharia-enterprise/libs/golang-commons/timeutil"
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

// jsonOutput represents the JSON output for coverage results.
type jsonOutput struct {
	Status    string  `json:"status"`
	Timestamp string  `json:"timestamp"`
	File      string  `json:"file"`
	Format    string  `json:"format"`
	Covered   int     `json:"covered"`
	Partial   int     `json:"partial"`
	Missed    int     `json:"missed"`
	Total     int     `json:"total"`
	Pct       float64 `json:"pct"`
	Threshold float64 `json:"threshold"`
	Passed    bool    `json:"passed"`
}

// FormatJSON returns a JSON coverage report.
func FormatJSON(r *Result) (string, error) {
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

	b, err := json.MarshalIndent(out, "", "  ")
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// FormatMarkdown returns a markdown coverage report.
func FormatMarkdown(r *Result) string {
	status := "PASS"
	if !r.Passed {
		status = "FAIL"
	}

	return fmt.Sprintf(
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
}
