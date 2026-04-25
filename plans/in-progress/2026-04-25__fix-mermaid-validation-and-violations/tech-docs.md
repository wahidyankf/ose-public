# Tech Docs — Fix Mermaid Validation and Violations

## Phase 0: Validator Changes

### Current State

`apps/rhino-cli/internal/mermaid/validator.go` `DefaultValidateOptions()` returns:

```go
ValidateOptions{MaxLabelLen: 30, MaxWidth: 3, MaxDepth: 5}
```

Rule 2 (width/depth check) always uses `span` regardless of direction:

```go
span := MaxWidth(diagram.Nodes, diagram.Edges)
depth := Depth(diagram.Nodes, diagram.Edges)

if span > opts.MaxWidth && depth > opts.MaxDepth {
    // warning
} else if span > opts.MaxWidth {
    // violation
}
```

This is direction-blind: for `graph LR`/`RL` diagrams, `depth` is the horizontal
dimension (rank columns left-to-right), not `span` (nodes stacked vertically per rank).

### Target State

Three changes to `validator.go`:

1. **`DefaultValidateOptions()`**: `MaxWidth: 3 → 4`, `MaxDepth: 5 → math.MaxInt`
2. **Rule 2 logic**: use `diagram.Direction` to select horizontal dimension
3. **`complex_diagram` warning**: apply same axis swap (warning becomes inactive by
   default since MaxDepth=math.MaxInt, fires only when user passes explicit `--max-depth`)

Direction-aware logic:

```go
span := MaxWidth(diagram.Nodes, diagram.Edges)
depth := Depth(diagram.Nodes, diagram.Edges)

var horizontal, vertical int
switch diagram.Direction {
case "LR", "RL":
    horizontal, vertical = depth, span
default: // TD, TB, BT, and unspecified
    horizontal, vertical = span, depth
}

if horizontal > opts.MaxWidth && vertical > opts.MaxDepth {
    // warning (complex_diagram)
} else if horizontal > opts.MaxWidth {
    // violation (width_exceeded)
}
```

### CLI Flag Defaults: `docs_validate_mermaid.go`

Update flag registration defaults:

```go
// before
validateMermaidCmd.Flags().IntVar(&validateMermaidMaxWidth, "max-width", 3, ...)
validateMermaidCmd.Flags().IntVar(&validateMermaidMaxDepth, "max-depth", 5, ...)

// after
validateMermaidCmd.Flags().IntVar(&validateMermaidMaxWidth, "max-width", 4, ...)
validateMermaidCmd.Flags().IntVar(&validateMermaidMaxDepth, "max-depth", 0, ...)
// 0 = math.MaxInt sentinel (no depth limit)
```

The `RunE` function must map `--max-depth 0` → `math.MaxInt` before passing to
`ValidateBlocks`. Check the existing sentinel pattern already used in the codebase.

### Test Updates: `validator_test.go`

Three existing test cases fail under new thresholds. Options:

- Increase their `span` values to 5+ (so they still trigger violations)
- Pass explicit `ValidateOptions{MaxWidth: 3}` to preserve the old threshold for that
  specific test case

Add new direction-aware test cases:

| Test             | Direction | Span | Depth | Expected     |
| ---------------- | --------- | ---- | ----- | ------------ |
| LR_wide_in_depth | LR        | 2    | 6     | violation    |
| LR_tall_in_span  | LR        | 5    | 2     | no violation |
| TD_wide_in_span  | TD        | 5    | 2     | violation    |
| TD_deep_in_depth | TD        | 2    | 6     | no violation |

### Parser: `diagram.Direction` Field

Confirm `types.go` / `parser.go` already parse and store `Direction` on `MermaidDiagram`.
If missing, add the field and parse from the header line (`graph LR`, `graph TD`, etc.).
Use `strings.Fields(header)[1]` after confirming the header format.

### Parser Behavior (Unchanged)

- `subgraph`/`end` lines are skipped entirely during parsing
- Standalone nodes without incoming edges default to rank 0
- Only `flowchart`/`graph` blocks trigger validation

## Phase 1: Fix Strategies

### Selecting a Strategy

```
Is min(span, depth) ≤ 4?
├── Yes → Strategy 0 (Direction Flip) — one-word fix
└── No  → Does the diagram have a clear sequential order?
          ├── Yes → Strategy 3 (Sequential Chaining)
          └── No  → Is there a natural semantic hub?
                    ├── Yes → Strategy 1 (Intermediate Grouping)
                    └── No  → Strategy 2 (Diagram Splitting)

Label too long only? → Strategy 4 (Label Shortening)
```

### Strategy 0 — Direction Flip

Change `graph TD` → `graph LR` (or vice versa). The horizontal dimension switches
axis. One-word fix when the other axis is ≤ 4.

Example (5-child fan in TD, flip to LR):

```
# Before — TD, span=5 (5 children share rank 1) → violation (5 > MaxWidth=4)
graph TD
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F

# After — LR, horizontal=depth=2 ≤ MaxWidth=4, vertical=span=5 → no violation
graph LR
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
```

**Use when**: `min(span, depth) ≤ 4` — i.e., at least one axis is within the limit,
so flipping makes that axis the horizontal dimension.

### Strategy 1 — Intermediate Grouping

Insert a semantic hub node that branches connect through, reducing fan-out at any
single rank.

**Use when**: diagram has a natural semantic grouping concept.

### Strategy 2 — Diagram Splitting

Break one wide diagram into two or more focused diagrams with prose bridges between
them. Each sub-diagram covers a coherent sub-topic.

**Use when**: no axis flip works and no natural hub exists. Prefer over information loss.

### Strategy 3 — Sequential Chaining

Linearize parallel branches when logical order can be established:
`A --> B --> C` instead of `A --> B` / `A --> C` / `A --> D`.

**Use when**: parallel branches represent a progression or priority order.

### Strategy 4 — Label Shortening

For `label_too_long` violations:

- Replace HTML entities: `#40;` → `(`, `#41;` → `)`, `#91;` → `[`, `#93;` → `]`
- Abbreviate text: `Configuration` → `Config`, `Implementation` → `Impl`
- Multi-line: split on `<br/>` and shorten each line to ≤ 30 chars
- Move dropped detail into prose before/after the diagram

**Limit**: 30 raw chars per line (validator). Note: rendering clips at ~20 chars —
keep displayed text shorter when possible.

## Phase 1: Batch Delivery Structure

After Phase 0 re-audit, organize failing files into batches by documentation area.
Suggested batch groupings for `docs/` (adjust based on re-audit output):

| Batch | Area                                                                      | Strategy bias                    |
| ----- | ------------------------------------------------------------------------- | -------------------------------- |
| 1     | `docs/explanation/software-engineering/programming-languages/typescript/` | Direction flip, chaining         |
| 2     | `docs/explanation/software-engineering/programming-languages/python/`     | Direction flip, chaining         |
| 3     | `docs/explanation/software-engineering/programming-languages/golang/`     | Direction flip, chaining         |
| 4     | `docs/explanation/software-engineering/frameworks/`                       | Mixed strategies                 |
| 5     | `docs/explanation/software-engineering/` (root and misc)                  | Label shortening                 |
| 6     | `docs/tutorials/`                                                         | Direction flip, label shortening |
| 7     | `docs/how-to/`                                                            | Direction flip, label shortening |
| 8     | `docs/reference/`                                                         | Direction flip, splitting        |
| 9     | Architecture / C4 diagrams                                                | Splitting (complex diagrams)     |
| 10    | Remaining files (catch-all)                                               | Mixed                            |

**Critical**: Re-run `go run ./apps/rhino-cli/main.go docs validate-mermaid` after
Phase 0 commits. Extract actual failing file list and group into batches. The table
above is provisional — file groupings may change significantly after direction-aware
re-audit reclassifies diagrams.

**Batch verification command**:

```bash
go run ./apps/rhino-cli/main.go docs validate-mermaid 2>&1 \
  | grep "^✗" \
  | grep "<batch-path-pattern>"
```

Must return zero lines before committing each batch.

## Phase 2: Governance Propagation

### Target File

`governance/conventions/formatting/diagrams.md`

### Changes (via `repo-rules-maker`)

1. **Add "Flowchart Width Constraints" section**:
   - MaxWidth = 4 (horizontal, direction-aware)
   - LR/RL: horizontal = depth (rank columns)
   - TD/TB/BT: horizontal = span (nodes per rank)
   - Label limit: 30 raw chars/line (validator) vs. ~20 chars (rendering)
   - Command: `rhino-cli docs validate-mermaid`

2. **Add "Width Violation Fix Strategy Guide"**:
   - All five strategies with selection decision tree (from this tech-docs.md)
   - Concrete before/after examples

3. **Update "Diagram Orientation" section**:
   - Soften "MUST use TD" → "use TD by default; use LR when it reduces horizontal
     width below MaxWidth=4"

4. **Remove duplicate Error 7** (identical to Error 5 in current file)

5. **Clarify label length discrepancy**: validator enforces 30 raw chars; rendering
   clips at ~20 chars

### Validation

After Phase 2 commit, run `repo-rules-quality-gate` in strict mode:

```bash
# Invoke via natural language in a Claude session:
# "Run repo-rules quality gate in strict mode"
```

Gate must pass with zero CRITICAL, HIGH, and MEDIUM findings.
