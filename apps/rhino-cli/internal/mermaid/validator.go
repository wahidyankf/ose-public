package mermaid

import "math"

// ValidateOptions configures the thresholds used during validation.
type ValidateOptions struct {
	MaxLabelLen      int
	MaxWidth         int
	MaxDepth         int
	MaxSubgraphNodes int
}

// DefaultValidateOptions returns the standard validation thresholds.
func DefaultValidateOptions() ValidateOptions {
	return ValidateOptions{
		MaxLabelLen:      30,
		MaxWidth:         4,
		MaxDepth:         math.MaxInt,
		MaxSubgraphNodes: 6,
	}
}

// ValidateBlocks validates a slice of MermaidBlocks against the given options.
// It applies three rules:
//  1. Node labels must not exceed MaxLabelLen runes.
//  2. Diagram span (MaxWidth) must not exceed MaxWidth unless depth also exceeds MaxDepth.
//  3. A block must not contain more than one flowchart/graph header.
//
// Rule 2 special case: when BOTH span > MaxWidth AND depth > MaxDepth, a Warning
// is emitted instead of a Violation.
func ValidateBlocks(blocks []MermaidBlock, opts ValidateOptions) ValidationResult {
	filesSeen := make(map[string]bool)
	var violations []Violation
	var warnings []Warning

	for _, block := range blocks {
		filesSeen[block.FilePath] = true

		diagram, count, _ := ParseDiagram(block)

		// Rule 3: multiple diagrams in one block.
		if count > 1 {
			violations = append(violations, Violation{
				Kind:       ViolationMultipleDiagrams,
				FilePath:   block.FilePath,
				BlockIndex: block.BlockIndex,
				StartLine:  block.StartLine,
			})
		}

		// Non-flowchart: skip Rule 1 and Rule 2.
		if count == 0 {
			continue
		}

		// Rule 1: label length.
		// EffectiveLabelLen handles <br/> multi-line labels by checking the longest line.
		for _, node := range diagram.Nodes {
			labelLen := EffectiveLabelLen(node.Label)
			if labelLen > opts.MaxLabelLen {
				violations = append(violations, Violation{
					Kind:        ViolationLabelTooLong,
					FilePath:    block.FilePath,
					BlockIndex:  block.BlockIndex,
					StartLine:   block.StartLine,
					NodeID:      node.ID,
					LabelText:   node.Label,
					LabelLen:    labelLen,
					MaxLabelLen: opts.MaxLabelLen,
				})
			}
		}

		// Rule 2: width/depth — direction-aware.
		span := MaxWidth(diagram.Nodes, diagram.Edges)
		depth := Depth(diagram.Nodes, diagram.Edges)

		var horizontal, vertical int
		switch diagram.Direction {
		case DirectionLR, DirectionRL: // named constants from types.go
			horizontal, vertical = depth, span
		case DirectionTB, DirectionTD, DirectionBT: // named constants from types.go
			horizontal, vertical = span, depth
		}

		if horizontal > opts.MaxWidth && vertical > opts.MaxDepth {
			// Both exceeded → warning only.
			warnings = append(warnings, Warning{
				Kind:        WarningComplexDiagram,
				FilePath:    block.FilePath,
				BlockIndex:  block.BlockIndex,
				StartLine:   block.StartLine,
				ActualWidth: horizontal,
				ActualDepth: vertical,
				MaxWidth:    opts.MaxWidth,
				MaxDepth:    opts.MaxDepth,
			})
		} else if horizontal > opts.MaxWidth {
			// Width exceeded alone → violation.
			violations = append(violations, Violation{
				Kind:        ViolationWidthExceeded,
				FilePath:    block.FilePath,
				BlockIndex:  block.BlockIndex,
				StartLine:   block.StartLine,
				ActualWidth: horizontal,
				MaxWidth:    opts.MaxWidth,
			})
		}
		// Depth exceeded alone → no output.

		// Rule 4: subgraph density (warning only).
		if opts.MaxSubgraphNodes > 0 {
			for _, sg := range diagram.Subgraphs {
				if len(sg.NodeIDs) > opts.MaxSubgraphNodes {
					warnings = append(warnings, Warning{
						Kind:              WarningSubgraphDense,
						FilePath:          block.FilePath,
						BlockIndex:        block.BlockIndex,
						StartLine:         block.StartLine + sg.StartLine,
						SubgraphLabel:     sg.Label,
						SubgraphNodeCount: len(sg.NodeIDs),
						MaxSubgraphNodes:  opts.MaxSubgraphNodes,
					})
				}
			}
		}
	}

	return ValidationResult{
		FilesScanned:  len(filesSeen),
		BlocksScanned: len(blocks),
		Violations:    violations,
		Warnings:      warnings,
	}
}
