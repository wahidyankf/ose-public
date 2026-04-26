// Package mermaid provides structural validation for Mermaid flowchart diagrams
// embedded in markdown files. It enforces three rules: label length, parallel rank
// width, and single-diagram-per-block. Non-flowchart diagram types are silently ignored.
package mermaid

// Direction represents the layout direction of a Mermaid flowchart.
type Direction string

const (
	DirectionTB Direction = "TB"
	DirectionTD Direction = "TD"
	DirectionBT Direction = "BT"
	DirectionLR Direction = "LR"
	DirectionRL Direction = "RL"
)

// ViolationKind identifies the category of a rule violation.
type ViolationKind string

const (
	ViolationLabelTooLong     ViolationKind = "label_too_long"
	ViolationWidthExceeded    ViolationKind = "width_exceeded"
	ViolationMultipleDiagrams ViolationKind = "multiple_diagrams"
)

// WarningKind identifies the category of a warning.
type WarningKind string

const (
	WarningComplexDiagram WarningKind = "complex_diagram"
	WarningSubgraphDense  WarningKind = "subgraph_density"
)

// MermaidBlock holds the raw source of a single ```mermaid fenced code block.
type MermaidBlock struct {
	FilePath   string
	BlockIndex int
	Source     string
	StartLine  int
}

// Node is a flowchart node with an ID and optional label.
type Node struct {
	ID    string
	Label string
}

// Edge is a directed connection between two nodes.
type Edge struct {
	From string
	To   string
}

// Subgraph is a Mermaid `subgraph ... end` block. NodeIDs holds direct children
// only (not transitive). StartLine is 1-indexed within the parent block.
type Subgraph struct {
	ID        string
	Label     string
	NodeIDs   []string
	StartLine int
}

// ParsedDiagram is the result of parsing a single MermaidBlock.
type ParsedDiagram struct {
	Block     MermaidBlock
	Direction Direction
	Nodes     []Node
	Edges     []Edge
	Subgraphs []Subgraph
}

// Warning is non-blocking (exit 0). Emitted by complex-diagram and
// subgraph-density rules.
type Warning struct {
	Kind       WarningKind
	FilePath   string
	BlockIndex int
	StartLine  int

	// complex_diagram fields
	ActualWidth int
	ActualDepth int
	MaxWidth    int
	MaxDepth    int

	// subgraph_density fields
	SubgraphLabel     string
	SubgraphNodeCount int
	MaxSubgraphNodes  int
}

// Violation is a rule violation that causes a non-zero exit.
type Violation struct {
	Kind        ViolationKind
	FilePath    string
	BlockIndex  int
	StartLine   int
	NodeID      string
	LabelText   string
	LabelLen    int
	MaxLabelLen int
	ActualWidth int
	MaxWidth    int
}

// ValidationResult aggregates all findings from a validation run.
type ValidationResult struct {
	FilesScanned  int
	BlocksScanned int
	Violations    []Violation
	Warnings      []Warning
}
