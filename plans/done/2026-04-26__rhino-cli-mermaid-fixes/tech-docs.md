# Technical Documentation

## Code Locations

| Concern                     | File                                                           |
| --------------------------- | -------------------------------------------------------------- |
| Default scan dirs           | `apps/rhino-cli/cmd/docs_validate_mermaid.go:202`              |
| Edge extraction             | `apps/rhino-cli/internal/mermaid/parser.go:200`                |
| Validation rules            | `apps/rhino-cli/internal/mermaid/validator.go:25`              |
| Type definitions            | `apps/rhino-cli/internal/mermaid/types.go`                     |
| BDD spec                    | `specs/apps/rhino/cli/gherkin/docs-validate-mermaid.feature`   |
| Parser tests                | `apps/rhino-cli/internal/mermaid/parser_test.go`               |
| Validator tests             | `apps/rhino-cli/internal/mermaid/validator_test.go`            |
| CLI integration tests       | `apps/rhino-cli/cmd/docs_validate_mermaid.integration_test.go` |
| Reporter (text/JSON output) | `apps/rhino-cli/internal/mermaid/reporter.go`                  |

## Phase 1 — Add `plans/` to Default Scan Dirs

**File**: `apps/rhino-cli/cmd/docs_validate_mermaid.go`

### Current

```go
// collectMDDefaultDirs scans docs/, governance/, .claude/, and root *.md files.
func collectMDDefaultDirs(repoRoot string) ([]string, error) {
    dirs := []string{
        filepath.Join(repoRoot, "docs"),
        filepath.Join(repoRoot, "governance"),
        filepath.Join(repoRoot, ".claude"),
    }
    // ...
}
```

### After

```go
// collectMDDefaultDirs scans docs/, governance/, .claude/, plans/, and root *.md files.
func collectMDDefaultDirs(repoRoot string) ([]string, error) {
    dirs := []string{
        filepath.Join(repoRoot, "docs"),
        filepath.Join(repoRoot, "governance"),
        filepath.Join(repoRoot, ".claude"),
        filepath.Join(repoRoot, "plans"), // CHANGED
    }
    // ...
}
```

The `walkMDFiles` helper (line 232) already skips `.next/`, `node_modules/`, and
`.git/` via the existing `skipDirs` map. No change needed there.

### Test changes

- `apps/rhino-cli/cmd/docs_validate_mermaid_test.go`: assert
  `collectMDDefaultDirs(repoRoot)` returns a slice that includes
  `filepath.Join(repoRoot, "plans")`.
- `apps/rhino-cli/cmd/docs_validate_mermaid.integration_test.go`: write a temp
  `plans/foo/diagram.md` with an over-long label, run the command with no path
  args, expect exit code != 0 and the file in the violations.
- New Gherkin scenario: "Plans directory is scanned by default" (see PRD).

## Phase 2 — Expand `&` Multi-Target Operator

**File**: `apps/rhino-cli/internal/mermaid/parser.go`

### Current

```go
// extractEdgeLine parses an edge line, updating nodeMap and appending to edges.
func extractEdgeLine(line string, nodeMap map[string]string, edges *[]Edge) {
    // ...

    // Split on arrow tokens.
    parts := arrowTokenRe.Split(line, -1)
    if len(parts) < 2 {
        return
    }

    // Extract node IDs and labels from each part.
    var nodeIDs []string
    for _, part := range parts {
        part = strings.TrimSpace(part)
        if part == "" {
            continue
        }
        // Try shape patterns to get ID + label.
        matched := false
        for _, re := range nodeShapePatterns {
            if m := re.FindStringSubmatch(part); m != nil {
                nodeMap[m[1]] = normalizeLabel(m[2])
                nodeIDs = append(nodeIDs, m[1])
                matched = true
                break
            }
        }
        if !matched {
            // Bare word.
            if m := nodeIDRe.FindStringSubmatch(part); m != nil {
                if _, exists := nodeMap[m[1]]; !exists {
                    nodeMap[m[1]] = ""
                }
                nodeIDs = append(nodeIDs, m[1])
            }
        }
    }

    // Create edges between consecutive pairs.
    for i := 0; i+1 < len(nodeIDs); i++ {
        *edges = append(*edges, Edge{From: nodeIDs[i], To: nodeIDs[i+1]})
    }
}
```

### After

```go
// extractEdgeLine parses an edge line, updating nodeMap and appending to edges.
// Handles Mermaid's '&' multi-target operator: "A & B --> C & D" becomes
// the Cartesian product of left and right groups: A→C, A→D, B→C, B→D.
func extractEdgeLine(line string, nodeMap map[string]string, edges *[]Edge) {
    // ...

    // Split on arrow tokens — each part is one node group.
    parts := arrowTokenRe.Split(line, -1)
    if len(parts) < 2 {
        return
    }

    // Each part may contain '&'-separated node IDs. Build a list of groups.
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

// extractNodeGroup splits a part on '&' and extracts node IDs from each segment,
// updating nodeMap as a side-effect for any labels seen.
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
// with the label if present. Helper to avoid duplicating shape-pattern logic.
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
```

### Backwards compatibility

A line `A --> B` (no `&`) splits into groups `[[A], [B]]`, Cartesian product is
the single edge `A → B`. Identical to the old behaviour. All existing tests must
pass without modification.

A line `A --> B --> C` splits into groups `[[A], [B], [C]]`, edges `A→B` and
`B→C`. Identical to old behaviour.

### Test changes

- `parser_test.go`: new cases
  - `A --> B & C & D` → 3 edges
  - `A & B --> C` → 2 edges
  - `A & B --> C & D` → 4 edges
  - `A --> B --> C` → 2 edges (regression check, unchanged)
- New Gherkin scenarios (see PRD).
- Existing test where `A --> B` produces one edge: must still pass unchanged.

## Phase 3 — `MaxSubgraphNodes` Warning

### Capture subgraph membership during parsing

**File**: `apps/rhino-cli/internal/mermaid/parser.go`

Currently the parser **skips subgraph delimiters** (line 76–79). To know how many
nodes are in each subgraph, the parser must track active subgraph context as it
walks lines. Add a `Subgraphs []Subgraph` field to `ParsedDiagram` and populate it
during the line walk.

```go
// types.go — new struct
type Subgraph struct {
    ID       string   // optional ID before the first square bracket
    Label    string   // text inside square brackets, may be empty
    NodeIDs  []string // direct children only (not transitive)
    StartLine int     // 1-indexed line within block
}

// ParsedDiagram — add field
type ParsedDiagram struct {
    Block      MermaidBlock
    Direction  Direction
    Nodes      []Node
    Edges      []Edge
    Subgraphs  []Subgraph // CHANGED
}
```

In `parser.go` line 76, replace the simple skip with a stateful walk: maintain a
stack of `*Subgraph`. On `subgraph` open, push a new subgraph. On `end`, pop. Any
node ID added to `nodeMap` while a subgraph is on the stack is appended to the
top-of-stack `NodeIDs`. Nesting is handled by the stack discipline.

### Add the validation rule

**File**: `apps/rhino-cli/internal/mermaid/validator.go`

Add to `ValidateOptions`:

```go
type ValidateOptions struct {
    MaxLabelLen       int
    MaxWidth          int
    MaxDepth          int
    MaxSubgraphNodes  int // CHANGED — default 6
}

func DefaultValidateOptions() ValidateOptions {
    return ValidateOptions{
        MaxLabelLen:      30,
        MaxWidth:         4,
        MaxDepth:         math.MaxInt,
        MaxSubgraphNodes: 6, // CHANGED
    }
}
```

Add to `ValidateBlocks` after Rule 2:

```go
// Rule 4: subgraph density (warning only).
for _, sg := range diagram.Subgraphs {
    if len(sg.NodeIDs) > opts.MaxSubgraphNodes {
        warnings = append(warnings, Warning{
            Kind:             WarningSubgraphDense,
            FilePath:         block.FilePath,
            BlockIndex:       block.BlockIndex,
            StartLine:        block.StartLine + sg.StartLine,
            SubgraphLabel:    sg.Label,
            SubgraphNodeCount: len(sg.NodeIDs),
            MaxSubgraphNodes: opts.MaxSubgraphNodes,
        })
    }
}
```

### New types

**File**: `apps/rhino-cli/internal/mermaid/types.go`

```go
const (
    WarningComplexDiagram WarningKind = "complex_diagram"
    WarningSubgraphDense  WarningKind = "subgraph_density" // CHANGED
)

type Warning struct {
    Kind              WarningKind
    FilePath          string
    BlockIndex        int
    StartLine         int

    // For complex_diagram
    ActualWidth int
    ActualDepth int
    MaxWidth    int
    MaxDepth    int

    // For subgraph_density
    SubgraphLabel     string
    SubgraphNodeCount int
    MaxSubgraphNodes  int
}
```

### CLI flag

**File**: `apps/rhino-cli/cmd/docs_validate_mermaid.go`

```go
// Existing:
validateMermaidCmd.Flags().IntVar(&validateMermaidMaxWidth, "max-width", 4, "...")

// Add:
validateMermaidCmd.Flags().IntVar(&validateMermaidMaxSubgraphNodes,
    "max-subgraph-nodes", 6,
    "Maximum direct child nodes per subgraph; emits a warning when exceeded")
```

Wire `validateMermaidMaxSubgraphNodes` through to `ValidateOptions{MaxSubgraphNodes: …}`.

### Reporter output

**File**: `apps/rhino-cli/internal/mermaid/reporter.go`

Extend the warning rendering branch to format `WarningSubgraphDense` differently
from `WarningComplexDiagram`:

```
WARN diagram.md block 1 (line 12): subgraph "WF1 — Development" has 7 children;
recommend ≤ 6 for mobile rendering. Consider splitting into two subgraphs.
```

### Test changes

- `parser_test.go`: confirm `ParseDiagram` returns the right `Subgraphs` count and
  membership for nested subgraphs and flat subgraphs.
- `validator_test.go`: subgraph with 6 nodes → no warning; with 7 → warning;
  threshold flag override → warning at 5 with `MaxSubgraphNodes=4`.
- `reporter_test.go`: format string for `WarningSubgraphDense`.
- New Gherkin scenarios (see PRD).

## Phase 4 — Validate Existing Diagrams Against New Rules

After Phases 1–3 ship, run the validator over `plans/in-progress/` and
`docs/reference/system-architecture/`:

```bash
nx run rhino-cli:run -- docs validate-mermaid \
  plans/in-progress/2026-04-26__organiclever-ci-staging-split/ \
  docs/reference/system-architecture/
```

Expected findings (anticipated):

- `plans/in-progress/2026-04-26__organiclever-ci-staging-split/tech-docs.md`:
  - `width_exceeded` violation in target-state diagram (5 nodes at rank 1 after
    `&` expansion: SC, LINT, BEI, FEI, DC fanout from T1)
  - `subgraph_density` warning for WF1 subgraph (7 children: SC, LINT, BEI, FEI,
    E2E, DC, DS)

These are **expected** outputs. They are surfaced as discovery; they do not block
this plan. Address in a follow-up commit (split the WF1 subgraph) or note in
`plans/ideas.md` for future work.

## Dependencies

All changes in this plan are internal to the existing `apps/rhino-cli` module and
the Go standard library. No new external Go modules are introduced.

**Go standard library packages used by new code**:

- `strings` — `strings.Split(part, "&")` and `strings.TrimSpace` in
  `extractNodeGroup` (Phase 2).
- `math` — `math.MaxInt` in `DefaultValidateOptions` (already used; unchanged).

**Internal package dependencies**:

- `extractNodeGroup` depends on the package-level variables `nodeShapePatterns`
  and `nodeIDRe` defined in `parser.go`. Both exist today; no changes to their
  definitions are required.
- `WarningSubgraphDense` and the new `Warning` fields depend on the `WarningKind`
  type and `Warning` struct already defined in `types.go`.
- The new `Subgraphs []Subgraph` field on `ParsedDiagram` is consumed by
  `validator.go`; the zero value (`nil` slice) is safe for all existing call sites
  that do not iterate subgraphs.

**Nx test targets affected**:

- `nx run rhino-cli:test:unit` — parser, validator, reporter, and CLI unit tests.
- `nx run rhino-cli:test:quick` — unit tests + coverage validation (≥ 90%).

No changes to `go.mod`, `go.sum`, or any external dependency are expected.

## Rollback

All changes across Phases 1–3 are additive:

- Phase 1 adds a directory string to a slice; removing it restores the previous
  behaviour.
- Phase 2 replaces the body of `extractEdgeLine` with a Cartesian-product
  implementation; the new implementation is backwards-compatible for single-target
  edges, but a rollback restores the original sequential-pairing logic.
- Phase 3 adds a new struct, a new constant, new fields, and a new CLI flag;
  removing them is safe because the zero value of `Subgraphs []Subgraph` is
  ignored by all existing call sites.

**Rollback procedure** (reverse-phase order):

```bash
# Revert Phase 3 (subgraph density warning):
git revert <phase-3-commit-SHA>

# Revert Phase 2 (& operator expansion):
git revert <phase-2-commit-SHA>

# Revert Phase 1 (plans/ scan dir):
git revert <phase-1-commit-SHA>
```

Phases may be reverted independently because each phase commit is self-contained
(one concern per commit per the delivery checklist). Reverting Phase 2 alone is
safe — Phase 3 depends on subgraph parsing added in Phase 3 itself, not on the
`&` expansion from Phase 2.

**Targeted file restore** (if a full `git revert` is too broad):

- `apps/rhino-cli/cmd/docs_validate_mermaid.go` — remove the `plans/` entry from
  `collectMDDefaultDirs`; remove the `--max-subgraph-nodes` flag wiring.
- `apps/rhino-cli/internal/mermaid/parser.go` — restore the original
  `extractEdgeLine` body; remove `extractNodeGroup` and
  `extractNodeIDAndLabel`; remove the subgraph stack logic.
- `apps/rhino-cli/internal/mermaid/validator.go` — remove `MaxSubgraphNodes`
  from `ValidateOptions` and `DefaultValidateOptions`; remove Rule 4 loop.
- `apps/rhino-cli/internal/mermaid/types.go` — remove `Subgraph` struct;
  remove `Subgraphs` field from `ParsedDiagram`; remove `WarningSubgraphDense`
  constant; remove `SubgraphLabel`, `SubgraphNodeCount`, `MaxSubgraphNodes`
  fields from `Warning`.
- `apps/rhino-cli/internal/mermaid/reporter.go` — remove the
  `WarningSubgraphDense` formatting branch.

After any rollback, run `nx run rhino-cli:test:quick` to confirm coverage is still
≥ 90%.

## Design Decisions

**1. Subgraph density is a warning, not a violation, on first ship.**
First-ship as a non-blocking warning lets the team observe how often it fires
across the existing corpus. If the rule proves accurate, a future plan can
promote it to a violation. Promotion is cheap; demoting a violation that turns
out to be too aggressive would be more disruptive.

**2. `MaxSubgraphNodes` defaults to 6.**
Mermaid renders a subgraph as a bounding box around its children. On a 320px
mobile viewport, six rectangular children with `<br/>`-padded labels (typical for
job nodes) consumes the available width. Seven is observably tight; the
OrganicLever WF1 has seven jobs and renders unreadably narrow on mobile. Six is
the breaking point where horizontal scroll becomes necessary.

**3. Cartesian product, not sequential pairing, for `&` expansion.**
Mermaid's actual semantics: `A & B --> C & D` is four edges, not two. Using
sequential pairing (e.g., A→C, B→D) would silently mismatch Mermaid's render.
Tests must explicitly cover the multi-source-multi-target case.

**4. `plans/` only — not `apps/`, `libs/`, `archived/`, `apps-labs/`.**

- `apps/` README files are mostly status docs without architectural diagrams.
- `libs/` similarly.
- `archived/` is frozen — adding scope would either flood with old findings
  (bad) or require excluding (drift).
- `apps-labs/` is experimental.
  Keeping the scope to `docs/`, `governance/`, `.claude/`, `plans/` matches the
  existing pattern (places where intentional diagrams live).

**5. Subgraph `StartLine` uses block-relative line numbers.**
The `Reporter` adds `block.StartLine` to convert to file-absolute line numbers
(consistent with how `width_exceeded` reports work today).

**6. Backwards compatibility tested explicitly.**
Every existing parser test must pass without modification. The `extractNodeGroup`
function path for a single-segment group (no `&`) reduces to the old behaviour.

**7. No reporter or output format breaking changes.**
A new `WarningKind` is added but existing fields remain. Tools consuming the JSON
reporter output (`-o json`) continue to parse unchanged warnings; new warnings
appear as additional entries in the same `warnings` array.
