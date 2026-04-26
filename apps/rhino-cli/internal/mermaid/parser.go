package mermaid

import (
	"regexp"
	"slices"
	"strings"
)

// flowchartHeaderRe matches a flowchart or graph header line (with optional direction).
var flowchartHeaderRe = regexp.MustCompile(`(?m)^\s*(flowchart|graph)(\s+(TB|TD|BT|LR|RL))?\s*$`)

// subgraphHeaderRe captures the optional ID and optional label of a subgraph
// declaration. Supported forms:
//
//	subgraph             — no id, no label
//	subgraph WF1         — id only
//	subgraph WF1 [Label] — id + bracketed label
//	subgraph "Label"     — quoted label only (treated as label, no id)
//	subgraph WF1["Label"]— id + bracketed quoted label
var subgraphHeaderRe = regexp.MustCompile(`^subgraph(?:\s+([^\s\["]+))?(?:\s*\[\s*"?([^"\]]*)"?\s*\])?\s*$`)

// arrowTokens is the set of substrings that identify edge lines.
var arrowTokenRe = regexp.MustCompile(`-->|---|-\.->|==>|--o|--x|<-->`)

// Node shape regexes: order matters — longest/most-specific match first.
// Each captures (nodeID, label).
var nodeShapePatterns = []*regexp.Regexp{
	// Double-circle: A(((label)))
	regexp.MustCompile(`^(\w+)\(\(\(([^)]*)\)\)\)`),
	// Stadium: A([label])
	regexp.MustCompile(`^(\w+)\(\[([^\]]*)\]\)`),
	// Circle: A((label))
	regexp.MustCompile(`^(\w+)\(\(([^)]*)\)\)`),
	// Subroutine: A[[label]]
	regexp.MustCompile(`^(\w+)\[\[([^\]]*)\]\]`),
	// Cylinder: A[(label)]
	regexp.MustCompile(`^(\w+)\[\(([^)]*)\)\]`),
	// Round: A(label)
	regexp.MustCompile(`^(\w+)\(([^)]*)\)`),
	// Hexagon: A{{label}}
	regexp.MustCompile(`^(\w+)\{\{([^}]*)\}\}`),
	// Diamond: A{label}
	regexp.MustCompile(`^(\w+)\{([^}]*)\}`),
	// Asymmetric: A>label]
	regexp.MustCompile(`^(\w+)>([^\]]*)\]`),
	// Parallelogram forward: A[/label/]
	regexp.MustCompile(`^(\w+)\[/([^/]*)/\]`),
	// Parallelogram back: A[\label\]
	regexp.MustCompile(`^(\w+)\[\\([^\\]*)\\]`),
	// Rectangle: A[label]
	regexp.MustCompile(`^(\w+)\[([^\]]*)\]`),
	// Modern API: A@{ label: "text" }
	regexp.MustCompile(`^(\w+)@\{\s*[^}]*label:\s*"([^"]*)"\s*[^}]*\}`),
}

// nodeIDRe matches a bare word node identifier.
var nodeIDRe = regexp.MustCompile(`^(\w+)$`)

// ParseDiagram parses a MermaidBlock into a ParsedDiagram.
// The second return value is the number of flowchart/graph headers found.
// count == 0 means the block is not a flowchart (caller should skip Rule 1/2).
// count > 1 means the caller should emit ViolationMultipleDiagrams.
func ParseDiagram(block MermaidBlock) (ParsedDiagram, int, error) {
	matches := flowchartHeaderRe.FindAllStringSubmatch(block.Source, -1)
	count := len(matches)
	if count == 0 {
		return ParsedDiagram{Block: block}, 0, nil
	}

	// Extract direction from the first header match.
	firstMatch := matches[0]
	dir := DirectionTB
	if len(firstMatch) >= 4 && strings.TrimSpace(firstMatch[3]) != "" {
		dir = Direction(strings.TrimSpace(firstMatch[3]))
	}

	// Parse nodes, edges, and subgraphs.
	nodeMap := make(map[string]string) // id → label (last-declaration-wins)
	var edges []Edge
	var subgraphs []Subgraph
	var stack []*Subgraph

	lines := strings.Split(block.Source, "\n")
	for lineIdx, raw := range lines {
		line := strings.TrimSpace(raw)
		if line == "" {
			continue
		}

		if strings.HasPrefix(line, "subgraph") {
			id, label := parseSubgraphHeader(line)
			stack = append(stack, &Subgraph{
				ID:        id,
				Label:     label,
				StartLine: lineIdx + 1,
			})
			continue
		}
		if line == "end" {
			if n := len(stack); n > 0 {
				subgraphs = append(subgraphs, *stack[n-1])
				stack = stack[:n-1]
			}
			continue
		}

		// Skip the flowchart/graph header lines.
		if flowchartHeaderRe.MatchString(line) {
			continue
		}

		var lineIDs []string
		before := snapshotKeys(nodeMap)
		if arrowTokenRe.MatchString(line) {
			extractEdgeLine(line, nodeMap, &edges)
		} else {
			extractStandaloneNode(line, nodeMap)
		}
		lineIDs = newKeys(nodeMap, before)
		// If a subgraph is open, attribute new IDs as direct children.
		if len(stack) > 0 && len(lineIDs) > 0 {
			top := stack[len(stack)-1]
			for _, id := range dedupOrder(lineIDs) {
				if !slices.Contains(top.NodeIDs, id) {
					top.NodeIDs = append(top.NodeIDs, id)
				}
			}
		}
	}
	// Pop any unclosed subgraphs so they still surface in the result.
	for i := len(stack) - 1; i >= 0; i-- {
		subgraphs = append(subgraphs, *stack[i])
	}

	// Build ordered node list preserving insertion order via a separate slice.
	// We need all node IDs that were referenced.
	seenOrder := collectNodeOrder(block.Source, nodeMap)
	var nodes []Node
	for _, id := range seenOrder {
		nodes = append(nodes, Node{ID: id, Label: nodeMap[id]})
	}

	return ParsedDiagram{
		Block:     block,
		Direction: dir,
		Nodes:     nodes,
		Edges:     edges,
		Subgraphs: subgraphs,
	}, count, nil
}

// parseSubgraphHeader extracts the optional ID and label from a subgraph header.
func parseSubgraphHeader(line string) (id, label string) {
	if m := subgraphHeaderRe.FindStringSubmatch(line); m != nil {
		return m[1], m[2]
	}
	// Fallback: strip the `subgraph ` prefix and treat the rest as a label.
	rest := strings.TrimSpace(strings.TrimPrefix(line, "subgraph"))
	rest = strings.Trim(rest, `"`)
	return "", rest
}

// snapshotKeys returns a set of nodeMap keys for diff comparison.
func snapshotKeys(m map[string]string) map[string]bool {
	out := make(map[string]bool, len(m))
	for k := range m {
		out[k] = true
	}
	return out
}

// newKeys returns keys in m that are absent from the snapshot.
func newKeys(m map[string]string, snapshot map[string]bool) []string {
	var out []string
	for k := range m {
		if !snapshot[k] {
			out = append(out, k)
		}
	}
	return out
}

// dedupOrder returns ids with duplicates removed, preserving first occurrence.
func dedupOrder(ids []string) []string {
	seen := map[string]bool{}
	var out []string
	for _, id := range ids {
		if !seen[id] {
			seen[id] = true
			out = append(out, id)
		}
	}
	return out
}

// collectNodeOrder returns node IDs in first-seen order from the source lines.
func collectNodeOrder(source string, nodeMap map[string]string) []string {
	seen := make(map[string]bool)
	var order []string

	lines := strings.Split(source, "\n")
	for _, raw := range lines {
		line := strings.TrimSpace(raw)
		if line == "" || strings.HasPrefix(line, "subgraph") || line == "end" {
			continue
		}
		if flowchartHeaderRe.MatchString(line) {
			continue
		}
		// Collect IDs referenced on this line.
		ids := extractAllNodeIDs(line)
		for _, id := range ids {
			if _, exists := nodeMap[id]; exists && !seen[id] {
				seen[id] = true
				order = append(order, id)
			}
		}
	}
	// Include any node IDs in nodeMap not yet seen (shouldn't happen but be safe).
	for id := range nodeMap {
		if !seen[id] {
			seen[id] = true
			order = append(order, id)
		}
	}
	return order
}

// extractAllNodeIDs pulls every node ID referenced on a single line.
// '&' multi-target operator expands so every group member contributes an ID.
func extractAllNodeIDs(line string) []string {
	var ids []string
	if arrowTokenRe.MatchString(line) {
		segments := arrowTokenRe.Split(line, -1)
		for _, seg := range segments {
			ids = append(ids, extractNodeIDsFromSegment(seg)...)
		}
	} else {
		ids = append(ids, extractNodeIDsFromSegment(line)...)
	}
	return ids
}

// extractNodeIDsFromSegment splits a segment on '&' and extracts all node IDs.
func extractNodeIDsFromSegment(seg string) []string {
	var ids []string
	for _, sub := range strings.Split(seg, "&") {
		if id := extractNodeIDFromSegment(sub); id != "" {
			ids = append(ids, id)
		}
	}
	return ids
}

// extractNodeIDFromSegment extracts a node ID from a single segment.
func extractNodeIDFromSegment(seg string) string {
	seg = strings.TrimSpace(seg)
	if seg == "" {
		return ""
	}
	// Try shape patterns first.
	for _, re := range nodeShapePatterns {
		if m := re.FindStringSubmatch(seg); m != nil {
			return m[1]
		}
	}
	// Bare word.
	if m := nodeIDRe.FindStringSubmatch(seg); m != nil {
		return m[1]
	}
	return ""
}

// extractStandaloneNode parses a standalone node declaration line and updates nodeMap.
func extractStandaloneNode(line string, nodeMap map[string]string) {
	line = strings.TrimSpace(line)
	for _, re := range nodeShapePatterns {
		if m := re.FindStringSubmatch(line); m != nil {
			nodeMap[m[1]] = normalizeLabel(m[2])
			return
		}
	}
	// Bare word (no label).
	if m := nodeIDRe.FindStringSubmatch(line); m != nil {
		if _, exists := nodeMap[m[1]]; !exists {
			nodeMap[m[1]] = ""
		}
	}
}

// extractEdgeLine parses an edge line, updating nodeMap and appending to edges.
// Handles Mermaid's '&' multi-target operator: "A & B --> C & D" expands to the
// Cartesian product of left and right groups (A→C, A→D, B→C, B→D). Single-target
// edges remain unchanged: "A --> B" still produces one edge.
func extractEdgeLine(line string, nodeMap map[string]string, edges *[]Edge) {
	// Handle edge labels like "A -- text --> B": replace "-- text -->" with "-->".
	// The character class excludes '-' and '>' so the match never spans an
	// adjacent arrow, leaving chains like "A --> B --> C" intact.
	linkTextRe := regexp.MustCompile(`--[^->\n]+?-->`)
	line = linkTextRe.ReplaceAllString(line, "-->")

	// Split on arrow tokens — each part is one node group (possibly &-joined).
	parts := arrowTokenRe.Split(line, -1)
	if len(parts) < 2 {
		return
	}

	var groups [][]string
	for _, part := range parts {
		ids := extractNodeGroup(part, nodeMap)
		if len(ids) > 0 {
			groups = append(groups, ids)
		}
	}

	// Cartesian product of consecutive groups.
	for i := 0; i+1 < len(groups); i++ {
		for _, from := range groups[i] {
			for _, to := range groups[i+1] {
				*edges = append(*edges, Edge{From: from, To: to})
			}
		}
	}
}

// extractNodeGroup splits part on '&' and extracts node IDs from each segment,
// updating nodeMap with any labels seen.
func extractNodeGroup(part string, nodeMap map[string]string) []string {
	var ids []string
	for _, seg := range strings.Split(part, "&") {
		seg = strings.TrimSpace(seg)
		if seg == "" {
			continue
		}
		if id := extractNodeIDAndLabel(seg, nodeMap); id != "" {
			ids = append(ids, id)
		}
	}
	return ids
}

// extractNodeIDAndLabel returns the node ID for a segment, updating nodeMap
// with the label if one is present.
func extractNodeIDAndLabel(seg string, nodeMap map[string]string) string {
	for _, re := range nodeShapePatterns {
		if m := re.FindStringSubmatch(seg); m != nil {
			nodeMap[m[1]] = normalizeLabel(m[2])
			return m[1]
		}
	}
	if m := nodeIDRe.FindStringSubmatch(seg); m != nil {
		if _, exists := nodeMap[m[1]]; !exists {
			nodeMap[m[1]] = ""
		}
		return m[1]
	}
	return ""
}

// normalizeLabel strips surrounding quotes (single or double) and backtick wrappers.
func normalizeLabel(s string) string {
	s = strings.TrimSpace(s)
	if len(s) >= 2 {
		if (s[0] == '"' && s[len(s)-1] == '"') ||
			(s[0] == '\'' && s[len(s)-1] == '\'') ||
			(s[0] == '`' && s[len(s)-1] == '`') {
			s = s[1 : len(s)-1]
		}
	}
	return s
}

// EffectiveLabelLen returns the display length of a Mermaid node label.
// Labels may contain <br/>, <br> HTML tags or \n escape sequences for multi-line
// rendering; each visual line is checked independently and the longest line length
// is returned. This matches Mermaid's rendering behaviour where wrappingWidth
// applies per visual line.
func EffectiveLabelLen(label string) int {
	if label == "" {
		return 0
	}
	// Normalise all multi-line break variants to a real newline.
	normalized := strings.ReplaceAll(label, "<br/>", "\n")
	normalized = strings.ReplaceAll(normalized, "<BR/>", "\n")
	normalized = strings.ReplaceAll(normalized, "<br>", "\n")
	normalized = strings.ReplaceAll(normalized, "<BR>", "\n")
	normalized = strings.ReplaceAll(normalized, `\n`, "\n") // Mermaid literal \n in labels
	maxLen := 0
	for _, line := range strings.Split(normalized, "\n") {
		if l := len([]rune(line)); l > maxLen {
			maxLen = l
		}
	}
	return maxLen
}
