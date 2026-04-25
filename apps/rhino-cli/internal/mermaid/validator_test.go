package mermaid

import (
	"testing"
)

// makeFlowchartBlock builds a MermaidBlock with the given mermaid source.
func makeFlowchartBlock(source string) MermaidBlock {
	return MermaidBlock{
		FilePath:   "test.md",
		BlockIndex: 0,
		Source:     source,
		StartLine:  1,
	}
}

// span4depth6Source produces a flowchart with max-width=4 and depth=6.
// Ranks: A=0, B/C/D/E=1, F=2, G=3, H=4, I=5 → 6 distinct ranks, max at rank 1 = 4.
const span4depth6Source = `flowchart TD
A --> B
A --> C
A --> D
A --> E
B --> F
F --> G
G --> H
H --> I`

// span4depth4Source produces a flowchart with max-width=4 and depth=4.
// Ranks: A=0, B/C/D/E=1, F=2, G=3 → 4 distinct ranks, max at rank 1 = 4.
const span4depth4Source = `flowchart TD
A --> B
A --> C
A --> D
A --> E
B --> F
F --> G`

// span2depth6Source produces a flowchart with max-width=2 and depth=6.
// Linear chain: A→B→C→D→E→F, plus A→G (width=2 at rank 0 is just 1, but rank 1 has B and G).
// A=0, B=1, G=1, C=2, D=3, E=4, F=5 → depth=6, max-width=2.
const span2depth6Source = `flowchart TD
A --> B
A --> G
B --> C
C --> D
D --> E
E --> F`

// lrWideInDepthSource: graph LR, span=2, depth=6 → in LR, horizontal=depth=6 > MaxWidth=4 → violation.
const lrWideInDepthSource = `graph LR
A --> B
A --> C
B --> D
D --> E
E --> F
F --> G`

// lrTallInSpanSource: graph LR, span=5, depth=2 → in LR, horizontal=depth=2 ≤ MaxWidth=4 → no violation.
const lrTallInSpanSource = `graph LR
A --> B
A --> C
A --> D
A --> E
A --> F`

// tdWideInSpanSource: graph TD, span=5, depth=2 → in TD, horizontal=span=5 > MaxWidth=4 → violation.
const tdWideInSpanSource = `graph TD
A --> B
A --> C
A --> D
A --> E
A --> F`

// tdDeepInDepthSource: graph TD, span=2, depth=6 → in TD, horizontal=span=2 ≤ MaxWidth=4 → no violation.
const tdDeepInDepthSource = `graph TD
A --> B
A --> C
B --> D
D --> E
E --> F
F --> G`

func TestValidateBlocks(t *testing.T) {
	defaultOpts := DefaultValidateOptions()

	tests := []struct {
		name           string
		blocks         []MermaidBlock
		opts           ValidateOptions
		wantViolations int
		wantWarnings   int
		violationKind  ViolationKind
		warningKind    WarningKind
	}{
		{
			name: "clean block short labels width within limit",
			blocks: []MermaidBlock{
				makeFlowchartBlock("flowchart TD\nA[Short] --> B[Label]"),
			},
			opts:           defaultOpts,
			wantViolations: 0,
			wantWarnings:   0,
		},
		{
			name: "label exactly at limit no violation",
			blocks: []MermaidBlock{
				makeFlowchartBlock("flowchart TD\nA[" + repeat30() + "]"),
			},
			opts:           defaultOpts,
			wantViolations: 0,
			wantWarnings:   0,
		},
		{
			name: "label at limit+1 violation",
			blocks: []MermaidBlock{
				makeFlowchartBlock("flowchart TD\nA[" + repeat31() + "]"),
			},
			opts:           defaultOpts,
			wantViolations: 1,
			wantWarnings:   0,
			violationKind:  ViolationLabelTooLong,
		},
		{
			name: "width exactly at limit no violation",
			// A → B, A → C, A → D: span=3 at rank 1 = MaxWidth
			blocks: []MermaidBlock{
				makeFlowchartBlock("flowchart TD\nA --> B\nA --> C\nA --> D"),
			},
			opts:           defaultOpts,
			wantViolations: 0,
			wantWarnings:   0,
		},
		{
			name: "width at limit+1 violation",
			// A → B, A → C, A → D, A → E: span=4 > MaxWidth=3 and depth=2 <= MaxDepth=5
			blocks: []MermaidBlock{
				makeFlowchartBlock("flowchart TD\nA --> B\nA --> C\nA --> D\nA --> E"),
			},
			opts:           ValidateOptions{MaxLabelLen: 30, MaxWidth: 3, MaxDepth: 5},
			wantViolations: 1,
			wantWarnings:   0,
			violationKind:  ViolationWidthExceeded,
		},
		{
			name: "non-flowchart block no violations",
			blocks: []MermaidBlock{
				makeFlowchartBlock("sequenceDiagram\nA->>B: hello"),
			},
			opts:           defaultOpts,
			wantViolations: 0,
			wantWarnings:   0,
		},
		{
			name: "multiple diagrams block violation",
			blocks: []MermaidBlock{
				makeFlowchartBlock("flowchart TD\nA --> B\nflowchart LR\nC --> D"),
			},
			opts:           defaultOpts,
			wantViolations: 1,
			violationKind:  ViolationMultipleDiagrams,
		},
		{
			name: "custom opts respected",
			// With MaxLabelLen=40 a 31-char label is fine.
			blocks: []MermaidBlock{
				makeFlowchartBlock("flowchart TD\nA[" + repeat31() + "]"),
			},
			opts:           ValidateOptions{MaxLabelLen: 40, MaxWidth: 5, MaxDepth: 10},
			wantViolations: 0,
			wantWarnings:   0,
		},
		{
			name: "both exceeded warning only",
			blocks: []MermaidBlock{
				makeFlowchartBlock(span4depth6Source),
			},
			opts:           ValidateOptions{MaxLabelLen: 30, MaxWidth: 3, MaxDepth: 5},
			wantViolations: 0,
			wantWarnings:   1,
			warningKind:    WarningComplexDiagram,
		},
		{
			name: "width only exceeded violation",
			blocks: []MermaidBlock{
				makeFlowchartBlock(span4depth4Source),
			},
			opts:           ValidateOptions{MaxLabelLen: 30, MaxWidth: 3, MaxDepth: 5},
			wantViolations: 1,
			wantWarnings:   0,
			violationKind:  ViolationWidthExceeded,
		},
		{
			name: "depth only exceeded no output",
			blocks: []MermaidBlock{
				makeFlowchartBlock(span2depth6Source),
			},
			opts:           defaultOpts,
			wantViolations: 0,
			wantWarnings:   0,
		},
		{
			name: "LR_wide_in_depth violation",
			blocks: []MermaidBlock{
				makeFlowchartBlock(lrWideInDepthSource),
			},
			opts:           defaultOpts,
			wantViolations: 1,
			wantWarnings:   0,
			violationKind:  ViolationWidthExceeded,
		},
		{
			name: "LR_tall_in_span no violation",
			blocks: []MermaidBlock{
				makeFlowchartBlock(lrTallInSpanSource),
			},
			opts:           defaultOpts,
			wantViolations: 0,
			wantWarnings:   0,
		},
		{
			name: "TD_wide_in_span violation",
			blocks: []MermaidBlock{
				makeFlowchartBlock(tdWideInSpanSource),
			},
			opts:           defaultOpts,
			wantViolations: 1,
			wantWarnings:   0,
			violationKind:  ViolationWidthExceeded,
		},
		{
			name: "TD_deep_in_depth no violation",
			blocks: []MermaidBlock{
				makeFlowchartBlock(tdDeepInDepthSource),
			},
			opts:           defaultOpts,
			wantViolations: 0,
			wantWarnings:   0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateBlocks(tt.blocks, tt.opts)
			if len(result.Violations) != tt.wantViolations {
				t.Errorf("violations = %d, want %d; violations: %+v", len(result.Violations), tt.wantViolations, result.Violations)
			}
			if len(result.Warnings) != tt.wantWarnings {
				t.Errorf("warnings = %d, want %d; warnings: %+v", len(result.Warnings), tt.wantWarnings, result.Warnings)
			}
			if tt.violationKind != "" && len(result.Violations) > 0 {
				if result.Violations[0].Kind != tt.violationKind {
					t.Errorf("violation kind = %q, want %q", result.Violations[0].Kind, tt.violationKind)
				}
			}
			if tt.warningKind != "" && len(result.Warnings) > 0 {
				if result.Warnings[0].Kind != tt.warningKind {
					t.Errorf("warning kind = %q, want %q", result.Warnings[0].Kind, tt.warningKind)
				}
			}
		})
	}
}

func TestValidateBlocks_FilesAndBlocksScanned(t *testing.T) {
	blocks := []MermaidBlock{
		{FilePath: "a.md", BlockIndex: 0, Source: "flowchart TD\nA --> B", StartLine: 1},
		{FilePath: "a.md", BlockIndex: 1, Source: "flowchart TD\nC --> D", StartLine: 10},
		{FilePath: "b.md", BlockIndex: 0, Source: "flowchart TD\nE --> F", StartLine: 1},
	}
	result := ValidateBlocks(blocks, DefaultValidateOptions())
	if result.FilesScanned != 2 {
		t.Errorf("FilesScanned = %d, want 2", result.FilesScanned)
	}
	if result.BlocksScanned != 3 {
		t.Errorf("BlocksScanned = %d, want 3", result.BlocksScanned)
	}
}

// repeat30 returns a string of exactly 30 characters.
func repeat30() string {
	return "123456789012345678901234567890"
}

// repeat31 returns a string of exactly 31 characters.
func repeat31() string {
	return "1234567890123456789012345678901"
}
