package mermaid

import (
	"slices"
	"testing"
)

func makeBlock(source string) MermaidBlock {
	return MermaidBlock{
		FilePath:   "test.md",
		BlockIndex: 0,
		Source:     source,
		StartLine:  1,
	}
}

func TestParseDiagram(t *testing.T) {
	tests := []struct {
		name          string
		source        string
		wantCount     int
		wantDirection Direction
		wantNodeIDs   []string
		wantEdges     []Edge
		nodeLabels    map[string]string
	}{
		{
			name:      "empty source",
			source:    "",
			wantCount: 0,
		},
		{
			name:      "non-flowchart block",
			source:    "sequenceDiagram\nA->>B: hello",
			wantCount: 0,
		},
		{
			name:          "simple flowchart TD",
			source:        "flowchart TD\nA --> B",
			wantCount:     1,
			wantDirection: DirectionTD,
			wantNodeIDs:   []string{"A", "B"},
			wantEdges:     []Edge{{From: "A", To: "B"}},
		},
		{
			name:          "node with rectangle label",
			source:        "flowchart TD\nA[Hello World]",
			wantCount:     1,
			wantDirection: DirectionTD,
			wantNodeIDs:   []string{"A"},
			nodeLabels:    map[string]string{"A": "Hello World"},
		},
		{
			name:          "node with quoted label",
			source:        `flowchart TD` + "\n" + `A["Long label text"]`,
			wantCount:     1,
			wantDirection: DirectionTD,
			wantNodeIDs:   []string{"A"},
			nodeLabels:    map[string]string{"A": "Long label text"},
		},
		{
			name:          "duplicate node id last-declaration-wins",
			source:        "flowchart TD\nA[First]\nA[Second]\nA --> B",
			wantCount:     1,
			wantDirection: DirectionTD,
			wantNodeIDs:   []string{"A", "B"},
			nodeLabels:    map[string]string{"A": "Second"},
		},
		{
			name:          "edge with link text",
			source:        "flowchart TD\nA -- text --> B",
			wantCount:     1,
			wantDirection: DirectionTD,
			wantNodeIDs:   []string{"A", "B"},
			wantEdges:     []Edge{{From: "A", To: "B"}},
		},
		{
			name:      "two flowchart headers",
			source:    "flowchart TD\nA --> B\nflowchart LR\nC --> D",
			wantCount: 2,
		},
		{
			name:          "graph LR direction",
			source:        "graph LR\nA --> B",
			wantCount:     1,
			wantDirection: DirectionLR,
			wantNodeIDs:   []string{"A", "B"},
			wantEdges:     []Edge{{From: "A", To: "B"}},
		},
		{
			name:          "flowchart with no direction defaults to TB",
			source:        "flowchart\nA --> B",
			wantCount:     1,
			wantDirection: DirectionTB,
			wantNodeIDs:   []string{"A", "B"},
		},
		{
			name: "subgraph block skipped",
			source: `flowchart TD
subgraph sg
  A
end
B --> A`,
			wantCount:     1,
			wantDirection: DirectionTD,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			block := makeBlock(tt.source)
			diagram, count, err := ParseDiagram(block)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if count != tt.wantCount {
				t.Errorf("count = %d, want %d", count, tt.wantCount)
			}
			if count == 0 {
				return // non-flowchart: no further checks
			}
			if tt.wantDirection != "" && diagram.Direction != tt.wantDirection {
				t.Errorf("Direction = %q, want %q", diagram.Direction, tt.wantDirection)
			}
			// Check node IDs present.
			for _, wantID := range tt.wantNodeIDs {
				found := false
				for _, n := range diagram.Nodes {
					if n.ID == wantID {
						found = true
						break
					}
				}
				if !found {
					t.Errorf("node %q not found; got nodes %v", wantID, diagram.Nodes)
				}
			}
			// Check labels.
			for wantID, wantLabel := range tt.nodeLabels {
				for _, n := range diagram.Nodes {
					if n.ID == wantID {
						if n.Label != wantLabel {
							t.Errorf("node %q label = %q, want %q", wantID, n.Label, wantLabel)
						}
						break
					}
				}
			}
			// Check edges.
			for _, wantEdge := range tt.wantEdges {
				found := false
				for _, e := range diagram.Edges {
					if e.From == wantEdge.From && e.To == wantEdge.To {
						found = true
						break
					}
				}
				if !found {
					t.Errorf("edge %v not found; got edges %v", wantEdge, diagram.Edges)
				}
			}
		})
	}
}

func TestExtractEdgeLine_AmpExpansion(t *testing.T) {
	tests := []struct {
		name      string
		line      string
		wantEdges []Edge
	}{
		{
			name: "single multi-target",
			line: "A --> B & C & D",
			wantEdges: []Edge{
				{From: "A", To: "B"},
				{From: "A", To: "C"},
				{From: "A", To: "D"},
			},
		},
		{
			name: "multi-source single target",
			line: "A & B --> C",
			wantEdges: []Edge{
				{From: "A", To: "C"},
				{From: "B", To: "C"},
			},
		},
		{
			name: "multi-source multi-target Cartesian",
			line: "A & B --> C & D",
			wantEdges: []Edge{
				{From: "A", To: "C"},
				{From: "A", To: "D"},
				{From: "B", To: "C"},
				{From: "B", To: "D"},
			},
		},
		{
			name: "regression chained single",
			line: "A --> B --> C",
			wantEdges: []Edge{
				{From: "A", To: "B"},
				{From: "B", To: "C"},
			},
		},
		{
			name:      "regression simple single",
			line:      "A --> B",
			wantEdges: []Edge{{From: "A", To: "B"}},
		},
		{
			name:      "regression edge with link text",
			line:      "A -- text --> B",
			wantEdges: []Edge{{From: "A", To: "B"}},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			nodeMap := map[string]string{}
			var edges []Edge
			extractEdgeLine(tt.line, nodeMap, &edges)
			if len(edges) != len(tt.wantEdges) {
				t.Fatalf("edge count = %d, want %d; got: %+v", len(edges), len(tt.wantEdges), edges)
			}
			for _, want := range tt.wantEdges {
				if !slices.Contains(edges, want) {
					t.Errorf("missing edge %v; got: %+v", want, edges)
				}
			}
		})
	}
}

func TestExtractEdgeLine_PreservesLabelsInAmpExpansion(t *testing.T) {
	nodeMap := map[string]string{}
	var edges []Edge
	extractEdgeLine("A[Alpha] & B[Beta] --> C[Gamma]", nodeMap, &edges)

	wantLabels := map[string]string{"A": "Alpha", "B": "Beta", "C": "Gamma"}
	for id, want := range wantLabels {
		got, ok := nodeMap[id]
		if !ok {
			t.Errorf("node %q missing from nodeMap", id)
			continue
		}
		if got != want {
			t.Errorf("node %q label = %q, want %q", id, got, want)
		}
	}
	if len(edges) != 2 {
		t.Errorf("edge count = %d, want 2; got: %+v", len(edges), edges)
	}
}

func TestParseDiagram_SubgraphCapture(t *testing.T) {
	tests := []struct {
		name           string
		source         string
		wantSubgraphs  int
		wantFirstID    string
		wantFirstLabel string
		wantFirstNodes []string
	}{
		{
			name: "simple subgraph 3 nodes",
			source: `flowchart TD
subgraph WF1
  A
  B
  C
end`,
			wantSubgraphs:  1,
			wantFirstID:    "WF1",
			wantFirstNodes: []string{"A", "B", "C"},
		},
		{
			name: "labeled subgraph quoted",
			source: `flowchart TD
subgraph WF1["Workflow 1"]
  A
  B
end`,
			wantSubgraphs:  1,
			wantFirstID:    "WF1",
			wantFirstLabel: "Workflow 1",
			wantFirstNodes: []string{"A", "B"},
		},
		{
			name: "nested subgraphs only direct children counted",
			source: `flowchart TD
subgraph Outer
  X
  subgraph Inner
    Y
    Z
  end
end`,
			wantSubgraphs: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			block := makeBlock(tt.source)
			diagram, count, err := ParseDiagram(block)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if count == 0 {
				t.Fatal("expected flowchart count >= 1")
			}
			if len(diagram.Subgraphs) != tt.wantSubgraphs {
				t.Fatalf("subgraphs = %d, want %d; got: %+v",
					len(diagram.Subgraphs), tt.wantSubgraphs, diagram.Subgraphs)
			}
			if tt.wantFirstID != "" {
				// Inner subgraphs end first; find by ID.
				var sg *Subgraph
				for i := range diagram.Subgraphs {
					if diagram.Subgraphs[i].ID == tt.wantFirstID {
						sg = &diagram.Subgraphs[i]
						break
					}
				}
				if sg == nil {
					t.Fatalf("subgraph %q not found; got: %+v", tt.wantFirstID, diagram.Subgraphs)
				}
				if tt.wantFirstLabel != "" && sg.Label != tt.wantFirstLabel {
					t.Errorf("Label = %q, want %q", sg.Label, tt.wantFirstLabel)
				}
				if len(tt.wantFirstNodes) > 0 {
					if len(sg.NodeIDs) != len(tt.wantFirstNodes) {
						t.Errorf("NodeIDs = %v, want %v", sg.NodeIDs, tt.wantFirstNodes)
					}
					for _, want := range tt.wantFirstNodes {
						if !slices.Contains(sg.NodeIDs, want) {
							t.Errorf("missing node %q in NodeIDs %v", want, sg.NodeIDs)
						}
					}
				}
			}
		})
	}
}

func TestParseDiagram_NestedOuterDirectChildrenOnly(t *testing.T) {
	source := `flowchart TD
subgraph Outer
  X
  subgraph Inner
    Y
    Z
  end
  W
end`
	block := makeBlock(source)
	diagram, _, err := ParseDiagram(block)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	var outer, inner *Subgraph
	for i := range diagram.Subgraphs {
		switch diagram.Subgraphs[i].ID {
		case "Outer":
			outer = &diagram.Subgraphs[i]
		case "Inner":
			inner = &diagram.Subgraphs[i]
		}
	}
	if outer == nil || inner == nil {
		t.Fatalf("missing subgraphs; got: %+v", diagram.Subgraphs)
	}
	wantOuter := []string{"X", "W"}
	wantInner := []string{"Y", "Z"}
	if len(outer.NodeIDs) != len(wantOuter) {
		t.Errorf("outer NodeIDs = %v, want %v", outer.NodeIDs, wantOuter)
	}
	if len(inner.NodeIDs) != len(wantInner) {
		t.Errorf("inner NodeIDs = %v, want %v", inner.NodeIDs, wantInner)
	}
	for _, w := range wantOuter {
		if !slices.Contains(outer.NodeIDs, w) {
			t.Errorf("missing %q in outer", w)
		}
	}
	for _, w := range wantInner {
		if !slices.Contains(inner.NodeIDs, w) {
			t.Errorf("missing %q in inner", w)
		}
	}
}

func TestParseDiagram_SubgraphHeaderNotANode(t *testing.T) {
	source := `flowchart TD
subgraph sg
  A
end
B --> A`
	block := makeBlock(source)
	diagram, count, err := ParseDiagram(block)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if count != 1 {
		t.Fatalf("count = %d, want 1", count)
	}
	for _, n := range diagram.Nodes {
		if n.ID == "sg" {
			t.Errorf("node 'sg' (subgraph header) must not appear in parsed nodes")
		}
	}
}
