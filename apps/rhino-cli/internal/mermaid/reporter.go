package mermaid

import (
	"encoding/json"
	"fmt"
	"strings"
)

// FormatText formats the validation result as human-readable text.
// With quiet=true and no violations/warnings, returns empty string.
// With verbose=true, emits per-file/block detail lines.
func FormatText(result ValidationResult, verbose, quiet bool) string {
	hasFindings := len(result.Violations) > 0 || len(result.Warnings) > 0

	if quiet && !hasFindings {
		return ""
	}

	var sb strings.Builder

	if verbose || hasFindings {
		// Group findings by file.
		fileViolations := make(map[string][]Violation)
		fileWarnings := make(map[string][]Warning)
		for _, v := range result.Violations {
			fileViolations[v.FilePath] = append(fileViolations[v.FilePath], v)
		}
		for _, w := range result.Warnings {
			fileWarnings[w.FilePath] = append(fileWarnings[w.FilePath], w)
		}

		// Collect unique file paths from violations and warnings.
		fileSet := make(map[string]bool)
		for fp := range fileViolations {
			fileSet[fp] = true
		}
		for fp := range fileWarnings {
			fileSet[fp] = true
		}

		for fp := range fileSet {
			vs := fileViolations[fp]
			ws := fileWarnings[fp]
			if len(vs) > 0 {
				fmt.Fprintf(&sb, "✗ %s\n", fp)
			} else if len(ws) > 0 {
				fmt.Fprintf(&sb, "⚠ %s\n", fp)
			} else {
				fmt.Fprintf(&sb, "✓ %s\n", fp)
			}
			for _, v := range vs {
				fmt.Fprintf(&sb, "  block %d (line %d): %s\n", v.BlockIndex, v.StartLine, violationDetail(v))
			}
			for _, w := range ws {
				fmt.Fprintf(&sb, "  block %d (line %d): %s\n", w.BlockIndex, w.StartLine, warningDetail(w))
			}
		}
	}

	// Summary footer.
	fmt.Fprintf(&sb,
		"Found %d violation(s) and %d warning(s) in %d file(s) (%d block(s) scanned).\n",
		len(result.Violations),
		len(result.Warnings),
		result.FilesScanned,
		result.BlocksScanned,
	)

	return sb.String()
}

func violationDetail(v Violation) string {
	switch v.Kind {
	case ViolationLabelTooLong:
		return fmt.Sprintf("[%s] node %q label %q is %d chars (max %d)",
			v.Kind, v.NodeID, v.LabelText, v.LabelLen, v.MaxLabelLen)
	case ViolationWidthExceeded:
		return fmt.Sprintf("[%s] span %d exceeds max-width %d",
			v.Kind, v.ActualWidth, v.MaxWidth)
	case ViolationMultipleDiagrams:
		return fmt.Sprintf("[%s] block contains multiple flowchart/graph headers", v.Kind)
	default:
		return fmt.Sprintf("[%s]", v.Kind)
	}
}

func warningDetail(w Warning) string {
	switch w.Kind {
	case WarningSubgraphDense:
		label := w.SubgraphLabel
		if label == "" {
			label = "(unnamed)"
		}
		return fmt.Sprintf(
			"[%s] subgraph %q has %d children; recommend ≤ %d for mobile rendering",
			w.Kind, label, w.SubgraphNodeCount, w.MaxSubgraphNodes,
		)
	default:
		return fmt.Sprintf("[%s] span %d (max %d) and depth %d (max %d) both exceeded",
			w.Kind, w.ActualWidth, w.MaxWidth, w.ActualDepth, w.MaxDepth)
	}
}

// jsonViolation mirrors Violation with camelCase JSON field names.
type jsonViolation struct {
	Kind        string `json:"kind"`
	FilePath    string `json:"filePath"`
	BlockIndex  int    `json:"blockIndex"`
	StartLine   int    `json:"startLine"`
	NodeID      string `json:"nodeId,omitempty"`
	LabelText   string `json:"labelText,omitempty"`
	LabelLen    int    `json:"labelLen,omitempty"`
	MaxLabelLen int    `json:"maxLabelLen,omitempty"`
	ActualWidth int    `json:"actualWidth,omitempty"`
	MaxWidth    int    `json:"maxWidth,omitempty"`
}

// jsonWarning mirrors Warning with camelCase JSON field names.
type jsonWarning struct {
	Kind              string `json:"kind"`
	FilePath          string `json:"filePath"`
	BlockIndex        int    `json:"blockIndex"`
	StartLine         int    `json:"startLine"`
	ActualWidth       int    `json:"actualWidth,omitempty"`
	ActualDepth       int    `json:"actualDepth,omitempty"`
	MaxWidth          int    `json:"maxWidth,omitempty"`
	MaxDepth          int    `json:"maxDepth,omitempty"`
	SubgraphLabel     string `json:"subgraphLabel,omitempty"`
	SubgraphNodeCount int    `json:"subgraphNodeCount,omitempty"`
	MaxSubgraphNodes  int    `json:"maxSubgraphNodes,omitempty"`
}

type jsonResult struct {
	FilesScanned  int             `json:"filesScanned"`
	BlocksScanned int             `json:"blocksScanned"`
	Violations    []jsonViolation `json:"violations"`
	Warnings      []jsonWarning   `json:"warnings"`
}

// FormatJSON formats the validation result as JSON.
func FormatJSON(result ValidationResult) (string, error) {
	vs := make([]jsonViolation, len(result.Violations))
	for i, v := range result.Violations {
		vs[i] = jsonViolation{
			Kind:        string(v.Kind),
			FilePath:    v.FilePath,
			BlockIndex:  v.BlockIndex,
			StartLine:   v.StartLine,
			NodeID:      v.NodeID,
			LabelText:   v.LabelText,
			LabelLen:    v.LabelLen,
			MaxLabelLen: v.MaxLabelLen,
			ActualWidth: v.ActualWidth,
			MaxWidth:    v.MaxWidth,
		}
	}
	ws := make([]jsonWarning, len(result.Warnings))
	for i, w := range result.Warnings {
		ws[i] = jsonWarning{
			Kind:              string(w.Kind),
			FilePath:          w.FilePath,
			BlockIndex:        w.BlockIndex,
			StartLine:         w.StartLine,
			ActualWidth:       w.ActualWidth,
			ActualDepth:       w.ActualDepth,
			MaxWidth:          w.MaxWidth,
			MaxDepth:          w.MaxDepth,
			SubgraphLabel:     w.SubgraphLabel,
			SubgraphNodeCount: w.SubgraphNodeCount,
			MaxSubgraphNodes:  w.MaxSubgraphNodes,
		}
	}

	out := jsonResult{
		FilesScanned:  result.FilesScanned,
		BlocksScanned: result.BlocksScanned,
		Violations:    vs,
		Warnings:      ws,
	}

	b, err := json.MarshalIndent(out, "", "  ")
	if err != nil {
		return "", fmt.Errorf("mermaid: JSON marshal: %w", err)
	}
	return string(b), nil
}

// FormatMarkdown formats the validation result as a markdown table.
func FormatMarkdown(result ValidationResult) string {
	if len(result.Violations) == 0 && len(result.Warnings) == 0 {
		return fmt.Sprintf(
			"All %d block(s) in %d file(s) passed mermaid validation.\n",
			result.BlocksScanned,
			result.FilesScanned,
		)
	}

	var sb strings.Builder
	sb.WriteString("| File | Block | Line | Severity | Kind | Detail |\n")
	sb.WriteString("|------|-------|------|----------|------|--------|\n")

	for _, v := range result.Violations {
		fmt.Fprintf(&sb, "| %s | %d | %d | error | %s | %s |\n",
			v.FilePath, v.BlockIndex, v.StartLine, v.Kind, violationDetail(v))
	}
	for _, w := range result.Warnings {
		fmt.Fprintf(&sb, "| %s | %d | %d | warning | %s | %s |\n",
			w.FilePath, w.BlockIndex, w.StartLine, w.Kind, warningDetail(w))
	}

	return sb.String()
}
