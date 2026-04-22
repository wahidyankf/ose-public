# Tech Docs: Mermaid Diagram Validation

## Dependencies

No new Go module dependencies. Uses only Go stdlib (`regexp`, `os`, `bufio`, `encoding/json`,
`strings`) plus the existing `github.com/spf13/cobra` already present in `go.mod`. Zero new
entries in `go.mod` or `go.sum` are expected.

---

## Architecture

Follows the existing rhino-cli layered pattern:

```
cmd/docs_validate_mermaid.go          ← cobra command, flags, I/O
internal/mermaid/
  types.go                            ← shared types (ViolationKind, Violation, ...)
  extractor.go                        ← markdown → []MermaidBlock
  parser.go                           ← mermaid source → ParsedDiagram (nodes, edges, direction)
  graph.go                            ← ParsedDiagram → rank assignment → maxWidth
  validator.go                        ← []ParsedDiagram → []Violation (applies 3 rules)
  reporter.go                         ← []Violation → text / JSON / markdown strings
```

No external Mermaid library. Both available Go options (`sammcj/go-mermaid`,
`tetrafolium/mermaid-check`) are pre-v0.1 with very low adoption — custom parser is
safer for a production validator.

---

## Types (`internal/mermaid/types.go`)

````go
type Direction string

const (
    DirectionTB Direction = "TB"
    DirectionTD Direction = "TD"
    DirectionBT Direction = "BT"
    DirectionLR Direction = "LR"
    DirectionRL Direction = "RL"
)

type ViolationKind string

const (
    ViolationLabelTooLong    ViolationKind = "label_too_long"
    ViolationWidthExceeded   ViolationKind = "width_exceeded"
    ViolationMultipleDiagrams ViolationKind = "multiple_diagrams"
)

type MermaidBlock struct {
    FilePath   string
    BlockIndex int    // 0-based index of this mermaid block within the file
    Source     string // raw content inside the ```mermaid fence
    StartLine  int    // 1-based line number of the opening fence in the file
}

type Node struct {
    ID    string
    Label string // raw label text stripped of bracket syntax and outer quotes
}

type Edge struct {
    From string // node ID
    To   string // node ID
}

type ParsedDiagram struct {
    Block     MermaidBlock
    Direction Direction
    Nodes     []Node
    Edges     []Edge
}

type WarningKind string

const (
    WarningComplexDiagram WarningKind = "complex_diagram"
)

// Warning is non-blocking (exit 0). Emitted when BOTH span > MaxWidth AND depth > MaxDepth.
type Warning struct {
    Kind        WarningKind
    FilePath    string
    BlockIndex  int
    StartLine   int
    ActualWidth int
    ActualDepth int
    MaxWidth    int
    MaxDepth    int
}

type Violation struct {
    Kind        ViolationKind
    FilePath    string
    BlockIndex  int
    StartLine   int
    NodeID      string // populated for ViolationLabelTooLong
    LabelText   string // populated for ViolationLabelTooLong
    LabelLen    int    // populated for ViolationLabelTooLong
    MaxLabelLen int    // populated for ViolationLabelTooLong
    ActualWidth int    // populated for ViolationWidthExceeded
    MaxWidth    int    // populated for ViolationWidthExceeded
}

type ValidationResult struct {
    FilesScanned  int
    BlocksScanned int
    Violations    []Violation
    Warnings      []Warning // non-blocking; exit 0 even when non-empty
}
````

---

## Markdown Extractor (`internal/mermaid/extractor.go`)

**Exported function signature**:

```go
func ExtractBlocks(filePath string, content string) []MermaidBlock
```

`filePath` is stored in each returned `MermaidBlock.FilePath`; `content` is the
pre-read file contents scanned line-by-line. The caller reads the file and passes both.

Scan file line-by-line. Detect fenced code blocks opened with ` ```mermaid `.
Collect all lines until the closing ` ``` `. Return one `MermaidBlock` per fence.

````
State machine:
  OUTSIDE  →  see "```mermaid" line  →  INSIDE (record StartLine, BlockIndex++)
  INSIDE   →  see "```" line         →  OUTSIDE (emit MermaidBlock)
  INSIDE   →  accumulate source lines
````

Edge cases:

- Indented fences (4 spaces) are NOT code fences per CommonMark — skip them.
- Fences with extra backticks (` ````mermaid `) close on matching count — for
  simplicity, match any closing ` ``` ` line (no-attribute). This covers 99% of real
  docs.
- Empty mermaid blocks: emit block with empty source; validator treats as no-diagram.

**Known Limitation**: A 4-backtick ` ````mermaid ` fence that contains a 3-backtick
code block inside it will be mishandled — the extractor closes the outer fence early
on the inner ` ``` ` line. In practice, this pattern does not appear in the repository's
documentation. Treating this as out of scope for v1.

---

## Parser (`internal/mermaid/parser.go`)

### Step 1 — Detect diagram count (Rule 3)

Count matches of the regex:

```
(?m)^\s*(flowchart|graph)(\s+(TB|TD|BT|LR|RL))?\s*$
```

The direction keyword is optional — `flowchart` alone (no direction token) is valid
Mermaid v9+ syntax and defaults to `TD`. The regex captures direction in group 3;
when group 3 is empty, default to `TB` (same layout axis as `TD`).

`ParseDiagram` returns the diagram count as a second return value
(`func ParseDiagram(block MermaidBlock) (ParsedDiagram, int, error)`). The caller
(`ValidateBlocks` in `validator.go`) checks `count > 1` and emits
`ViolationMultipleDiagrams` there. The parser does not emit violations directly — it
only returns parsed data and the count.

If count > 1 → `ValidateBlocks` emits `ViolationMultipleDiagrams`; still parses first
diagram for Rules 1 and 2.

If count == 0 → block is not a flowchart (`sequenceDiagram`, `classDiagram`, `gantt`,
`gitGraph`, `pie`, `mindmap`, etc.); **skip all validation**. These types are outside
scope and must never be flagged. The validator passes them silently — no violation, no
warning, no output line for that block.

### Step 2 — Extract direction

Capture group 3 from the first match of the regex above.
If empty (direction-optional form), default to `TB`.
Normalize `TD` → treated same as `TB` in the graph algorithm (identical layout axis).

### Step 3 — Extract nodes and labels

Lines that declare a standalone node or appear as endpoints in edges can carry labels.
Use a two-pass scan:

**Pass A — standalone node declarations** (line has no arrow token):

```
Bracket shapes and their label-extraction regexes (applied in order):
  Double-circle:  \w+\(\(\(([^)]*)\)\)\)
  Stadium:        \w+\(\[([^\]]*)\]\)
  Circle:         \w+\(\(([^)]*)\)\)
  Subroutine:     \w+\[\[([^\]]*)\]\]
  Cylinder:       \w+\[\(([^)]*)\)\]
  Round:          \w+\(([^)]*)\)
  Hexagon:        \w+\{\{([^}]*)\}\}
  Diamond:        \w+\{([^}]*)\}
  Asymmetric:     \w+>([^\]]*)\]
  Trapezoid:      \w+\[/([^/\\]*)[/\\]\]
  Parallelogram:  \w+\[/([^/]*)/\]  or  \w+\[\\([^\\]*)\\]
  Rectangle:      \w+\[([^\]]*)\]
  Modern API:     \w+@\{\s*[^}]*label:\s*"([^"]*)"\s*[^}]*\}
```

For each match, record `Node{ID: capture[0], Label: stripQuotes(capture[1])}`.

**Pass B — nodes declared inline in edge lines**:

Edge lines contain arrow tokens (`-->`, `---`, `-.->`, `==>`, `--o`, `--x`, `<-->`,
etc.). Split on arrow tokens. Each segment before/after the arrow may carry a node
declaration with brackets. Apply the same bracket regexes from Pass A.

If a node ID is seen multiple times (last-wins per Mermaid spec), update its label.
Nodes seen only as bare IDs (no brackets, no label) get `Label: ""` — length 0, never
flagged for Rule 1.

### Label normalization

After extracting raw label text:

1. Strip surrounding `"` or `'` quotes.
2. Strip surrounding markdown backtick blocks: ``"`text`"`` → `text`.
3. Do NOT strip HTML entities (count as characters — rendering engines expand them,
   making the visual label longer).

Label length = `len([]rune(normalizedLabel))` (Unicode-safe).

---

## Graph Algorithm (`internal/mermaid/graph.go`)

Computes the maximum number of nodes at any single rank (perpendicular span).

**Direction semantics** (confirmed against Dagre source and G6 AntV docs):

| Direction          | Each rank is a… | Perpendicular span = | Limit controls |
| ------------------ | --------------- | -------------------- | -------------- |
| `TB` / `TD` / `BT` | horizontal row  | nodes side-by-side   | diagram WIDTH  |
| `LR` / `RL`        | vertical column | nodes stacked        | diagram HEIGHT |

The rank-assignment algorithm is **direction-independent**: Dagre (the Mermaid default
layout engine) computes ranks purely from graph topology. The `rankdir` direction keyword
is applied as a post-computation rendering transform — it rotates which physical screen
axis carries rank depth vs. perpendicular span, but does not change which nodes share a
rank. Therefore `MaxWidth` in `graph.go` takes no `Direction` parameter and runs
identically for all five direction keywords.

```
Input:  nodes []Node, edges []Edge
Output: maxWidth int  (MaxWidth)
        depth    int  (Depth — number of distinct rank values, i.e. longest path + 1)

Two exported functions share the same rank-assignment core:
  MaxWidth(nodes []Node, edges []Edge) int — returns max(len(rank-group))
  Depth(nodes []Node, edges []Edge) int    — returns len(distinct-rank-values)
    // Special case: empty graph (no nodes) returns 0 — deliberate, not derived from formula.
    // Non-empty graph: equals longest-path-length + 1 (rank 0 is always present for sources).
Both call an unexported rankAssign helper to avoid duplicate logic.

Algorithm (longest-path rank assignment on DAG):

1. Build adjacency list: outgoing[u] = [v1, v2, ...]
2. Compute in-degree for each node ID.
3. Topological sort (Kahn's algorithm):
   - Queue all nodes with in-degree 0 (sources).
   - Process in BFS order; for each node u dequeued:
       // source nodes keep their initialized rank of 0; no assignment needed
       for each v in outgoing[u]:
           rank[v] = max(rank[v], rank[u]+1)
           in-degree[v]--
           if in-degree[v] == 0: enqueue v
4. If any node unvisited after Kahn's (cycle detected):
   - Assign rank 0 to all unranked nodes. (Cycles are rare; safe fallback.)
5. Group node IDs by rank value.
6. maxWidth = max(len(group) for each rank)
```

**Subgraph handling**: `subgraph ... end` blocks are stripped from the source before
parsing. Node declarations and edges inside subgraphs are still included — they are
regular graph nodes with a visual grouping overlay, not a separate rank level. Per
Mermaid docs, a subgraph `direction` override is **voided** when any subgraph node
links outside the subgraph boundary (the subgraph inherits the parent direction). To
keep v1 simple and conservative, the validator treats all nodes as belonging to the
parent diagram's rank structure regardless of subgraph direction declarations.

**Disconnected nodes** (declared but no edges): assigned rank 0 (source).

**Depth is not validated**: The number of ranks (depth = longest path from source to
sink) is unbounded. A 20-step sequential chain has maxWidth = 1 at every rank and
passes Rule 2 regardless of its length. Only the perpendicular span is checked.

---

## Validator (`internal/mermaid/validator.go`)

```go
type ValidateOptions struct {
    MaxLabelLen int // default 30 — tied to Mermaid wrappingWidth:200px at 16px font (~28–30 chars)
    MaxWidth    int // default 3
    MaxDepth    int // default 5 — used only in the both-exceeded warning path
}

func ValidateBlocks(blocks []MermaidBlock, opts ValidateOptions) ValidationResult
```

For each block:

1. Call `ParseDiagram(block)` → `(ParsedDiagram, int, error)`. The second return value
   is the diagram count. If parse error, record as internal warning (not user violation);
   continue.
2. **Rule 3**: if diagram count > 1 → emit `ViolationMultipleDiagrams`. (The validator
   emits this violation, not the parser. The parser only returns the count.)
3. **Rule 1**: for each node, if `len([]rune(node.Label)) > opts.MaxLabelLen` →
   emit `ViolationLabelTooLong`.
4. **Rule 2**:
   - Compute `span = graph.MaxWidth(diagram.Nodes, diagram.Edges)`
   - Compute `depth = graph.Depth(diagram.Nodes, diagram.Edges)`
   - If `span > opts.MaxWidth && depth > opts.MaxDepth` →
     emit `Warning{Kind: WarningComplexDiagram, ActualWidth: span, ActualDepth: depth, ...}`
     (non-blocking; exit 0).
   - Else if `span > opts.MaxWidth` →
     emit `ViolationWidthExceeded` (blocking; exit 1).
   - Depth alone exceeding `opts.MaxDepth` produces no output.

---

## Reporter (`internal/mermaid/reporter.go`)

### Text (default)

```
✓  docs/tutorials/getting-started.md — 2 blocks, no violations
✗  docs/explanation/architecture.md — 3 blocks, 2 violations
     Block 1 (line 42): label_too_long — node "A" label "Deploy to production Kubernetes" (31 chars, max 30)
     Block 2 (line 87): width_exceeded — max width 5, limit 3
⚠  docs/explanation/big-overview.md — 1 block, 1 warning
     Block 0 (line 10): complex_diagram — width 4 (limit 3) and depth 7 (limit 5); consider simplifying
```

Summary line: `Found N violation(s) and W warning(s) in M file(s) (K block(s) scanned).`
When W > 0 and N == 0, command exits 0 but prints the warning lines.

### JSON

```json
{
  "filesScanned": 3,
  "blocksScanned": 5,
  "violations": [
    {
      "kind": "label_too_long",
      "filePath": "docs/explanation/architecture.md",
      "blockIndex": 0,
      "startLine": 42,
      "nodeId": "A",
      "labelText": "Deploy to production Kubernetes",
      "labelLen": 31,
      "maxLabelLen": 30
    }
  ],
  "warnings": [
    {
      "kind": "complex_diagram",
      "filePath": "docs/explanation/big-overview.md",
      "blockIndex": 0,
      "startLine": 10,
      "actualWidth": 4,
      "actualDepth": 7,
      "maxWidth": 3,
      "maxDepth": 5
    }
  ]
}
```

### Markdown

Table with columns: File | Block | Line | Severity | Kind | Detail.
Severity column is `error` for violations, `warning` for warnings.

---

## Command (`cmd/docs_validate_mermaid.go`)

**The command is read-only.** It opens files for reading only and never modifies any file
under any code path. `ValidateBlocks` is a pure function: it returns a `ValidationResult`
with no side effects. The command writes only to `cmd.OutOrStdout()` / `cmd.OutOrStderr()`.

The testable function variable `docsValidateMermaidFn` is declared in `cmd/testable.go`
(alongside `docsValidateAllLinksFn` and other internal-package delegations), consistent
with the existing pattern for commands that delegate to internal packages.

```go
var (
    validateMermaidStagedOnly  bool
    validateMermaidChangedOnly bool
    validateMermaidMaxLabelLen int
    validateMermaidMaxWidth    int
    validateMermaidMaxDepth    int
)

var validateMermaidCmd = &cobra.Command{
    Use:   "validate-mermaid",
    Short: "Validate Mermaid flowchart diagrams in markdown files",
    ...
    RunE: runValidateMermaid,
}

func init() {
    docsCmd.AddCommand(validateMermaidCmd)
    validateMermaidCmd.Flags().BoolVar(&validateMermaidStagedOnly, "staged-only", false,
        "only validate staged files (pre-commit use)")
    validateMermaidCmd.Flags().BoolVar(&validateMermaidChangedOnly, "changed-only", false,
        "only validate files changed since upstream (pre-push use)")
    validateMermaidCmd.Flags().IntVar(&validateMermaidMaxLabelLen, "max-label-len", 30,
        "max characters in a node label (default 30 ≈ Mermaid wrappingWidth:200px at 16px font)")
    validateMermaidCmd.Flags().IntVar(&validateMermaidMaxWidth, "max-width", 3,
        "max nodes at the same rank")
    validateMermaidCmd.Flags().IntVar(&validateMermaidMaxDepth, "max-depth", 5,
        "depth threshold for the both-exceeded warning: when span>max-width AND depth>max-depth, emit warning not error")
}
```

File discovery mirrors `docs validate-links`:

- `--staged-only`: `git diff --cached --name-only --diff-filter=ACMR` filtered to `*.md`
- `--changed-only`: `git diff --name-only @{u}..HEAD` filtered to `*.md`; if no
  upstream (`@{u}` fails), falls back to scanning default directories
- No flags: scan default directories (`docs/`, `governance/`, `.claude/`, root `*.md`)
- Positional args: scan the given paths (files or directories)

---

## Nx Target (`apps/rhino-cli/project.json`)

```json
"validate:mermaid": {
  "command": "CGO_ENABLED=0 go run -C apps/rhino-cli main.go docs validate-mermaid",
  "cache": true,
  "inputs": [
    "{projectRoot}/**/*.go",
    "{workspaceRoot}/docs/**/*.md",
    "{workspaceRoot}/governance/**/*.md",
    "{workspaceRoot}/.claude/**/*.md",
    "{workspaceRoot}/*.md"
  ],
  "outputs": []
}
```

The `"{workspaceRoot}/*.md"` entry ensures root-level markdown files (e.g., `README.md`)
invalidate the cache when changed, since the default scan includes repo root `*.md`.

---

## Pre-push Hook Integration (`.husky/pre-push`)

The new block must be placed **inside** the existing `if [ -n "$RANGE" ]; then` guard
so that the `$CHANGED` variable (which is set only inside that block) is in scope.

Add inside the `if [ -n "$RANGE" ]; then` block, after the existing naming-validator
conditionals:

```bash
if [ -n "$RANGE" ]; then
  CHANGED=$(git diff --name-only "$RANGE" 2>/dev/null || echo "")
  if echo "$CHANGED" | grep -qE '^(\.claude/agents/|\.opencode/agent/)'; then
    npx nx run rhino-cli:validate:naming-agents
  fi
  if echo "$CHANGED" | grep -qE '^governance/workflows/'; then
    npx nx run rhino-cli:validate:naming-workflows
  fi
  # ADD THIS BLOCK:
  if echo "$CHANGED" | grep -qE '\.md$'; then
    npx nx run rhino-cli:validate:mermaid --args="--changed-only"
  fi
fi
```

The `--args="--changed-only"` passes the flag through `npx nx run` to the underlying
`rhino-cli docs validate-mermaid --changed-only` invocation. (The `-- <flag>` passthrough
form is not reliably supported for `command`-type Nx targets; `--args=` is the confirmed
syntax per Nx docs.)

**Note on `--staged-only`**: The `--staged-only` flag is built and tested but is **not**
wired into any hook in this plan iteration. It is available for manual invocation
(`rhino-cli docs validate-mermaid --staged-only`) or future pre-commit integration.
The README.md Key Decisions section mentions pre-commit as the intended use context;
wiring it is left to a follow-up.

---

## File Impact

**New files** (all created under `apps/rhino-cli/`): see [Architecture](#architecture) section
above for the complete list (`internal/mermaid/types.go`, `extractor.go`, `parser.go`, `graph.go`,
`validator.go`, `reporter.go`; command file `cmd/docs_validate_mermaid.go`; test files for each).

**Existing files modified**:

| File                                            | Change                                          |
| ----------------------------------------------- | ----------------------------------------------- |
| `apps/rhino-cli/project.json`                   | Add `validate:mermaid` Nx target                |
| `apps/rhino-cli/cmd/testable.go`                | Add `docsValidateMermaidFn` delegation variable |
| `.husky/pre-push`                               | Add conditional mermaid validation block        |
| `apps/rhino-cli/README.md`                      | Document new `validate-mermaid` subcommand      |
| `specs/apps/rhino/cli/gherkin/README.md`        | Add row to feature-file table                   |
| `governance/conventions/formatting/diagrams.md` | Add reference to new CLI validator              |

---

## Rollback

If the `validate:mermaid` gate causes false-positive rejections after deployment:

1. **Revert the `.husky/pre-push` change**: Remove the `if echo "$CHANGED" | grep -qE '\.md$'`
   block from inside the `if [ -n "$RANGE" ]; then` guard. Commit with
   `chore(husky): temporarily disable mermaid validation in pre-push`.
2. **Leave the Nx target in place**: The `validate:mermaid` target is non-destructive;
   removing it from the hook does not require removing it from `project.json`.
3. **Leave the command code in place**: The `docs validate-mermaid` command can remain;
   it is only invoked explicitly or via the hook.
4. **Diagnose and fix**: Identify the false-positive pattern, update the regex or add a
   `--ignore` flag, then re-enable the hook block.

---

## Testing Strategy

Three-level standard (matching all other rhino-cli commands):

| Level       | File pattern                                       | What it tests                                                                            |
| ----------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Unit        | `*_test.go` (no build tag)                         | Pure functions in `internal/mermaid/`; godog BDD scenarios via mock filesystem           |
| Integration | `*.integration_test.go` (`//go:build integration`) | Real temp-dir `.md` files, real git staging; drives commands in-process via `cmd.RunE()` |
| E2E         | n/a                                                | CLI apps have no E2E tier                                                                |

**Coverage target**: ≥ 90% (enforced by `test:quick` via `rhino-cli test-coverage validate`).

### Key unit test cases for `graph.go`

```
MaxWidth:
  Linear chain A→B→C          → maxWidth = 1
  Fan-out A→B, A→C, A→D       → maxWidth = 3 (B,C,D all rank 1)
  Fan-out A→B, A→C, A→D, A→E  → maxWidth = 4
  Diamond A→B, A→C, B→D, C→D  → maxWidth = 2 (B,C both rank 1)
  Disconnected nodes           → rank 0, counted in rank-0 group
  Cycle A→B→A                  → fallback rank 0 for both

Depth:
  Empty graph                  → depth = 0
  Single node, no edges        → depth = 1 (one rank: rank 0)
  Linear chain A→B→C           → depth = 3 (ranks 0, 1, 2)
  Fan-out A→B, A→C, A→D        → depth = 2 (ranks 0, 1)
  Diamond A→B, A→C, B→D, C→D  → depth = 3 (ranks 0, 1, 2)
  Cycle A→B→A                  → depth = 1 (both rank 0 after fallback)
```

### Key unit test cases for `validator.go` (warning path)

```
span=4, depth=6, max-width=3, max-depth=5 → Warning{WarningComplexDiagram}; no Violation
span=4, depth=4, max-width=3, max-depth=5 → Violation{ViolationWidthExceeded}; no Warning
span=2, depth=6, max-width=3, max-depth=5 → no Warning, no Violation (depth alone ignored)
span=4, depth=4, max-width=3, max-depth=3 → Warning (depth=4 > max-depth=3, span=4 > max-width=3)
```
