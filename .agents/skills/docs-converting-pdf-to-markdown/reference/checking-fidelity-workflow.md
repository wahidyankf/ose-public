# Checking PDF-to-Markdown Fidelity: Validation Workflow

## Validation Workflow

**Lifecycle filter**: When exact ID `md-mermaid` is delegated, do not run `crane check-all` or
Step 7 because both execute the owned syntax predicate; use the non-Mermaid per-dimension commands.
For delegated `markdownlint`, `format-staged`, `md-heading-hierarchy`, `md-frontmatter`,
`md-links`, or `md-naming`, omit only generic Markdown mechanics. Retain all source-comparison
checks, including PDF-corresponding heading depth/order and figure representation. Omitted
`delegated-gate-ids` means standalone full validation.

**Step 0 — Initialize report**: `crane report --init "$PDF_FILE" --md "$MD_FILE" --scope pdf-to-md`
creates a UUID-chained, UTC+7-timestamped report at
`local-tmp/pdf-to-md/pdf-to-md__{uuid-chain}__{timestamp}__audit.md`.

**Step 1 — Pre-flight**: verify both files exist and the MD file is non-empty; get page count via
`crane pdf --info "$PDF_FILE"`.

**Step 2 — Text completeness (preferred single-pass)**: `crane check-all "$PDF_FILE" "$MD_FILE"`
runs all six core dimensions (text, heading, nesting, table, figure, mermaid) with one shared PDF
extraction; add `--cache-dir "$CACHE_DIR"` on repeat runs against the same PDF. Each finding's
`category` field carries its dimension label. **Fallback (per-dimension)**: `crane text --check
"$PDF_FILE" "$MD_FILE"` when investigating a single failure. **Large-PDF timeout protocol**: `crane
check-all` may exceed practical completion time above ~200 pages (text-completeness dominates cost)
— on timeout or empty output, fall back to per-dimension subcommands, and if a dimension was sampled
rather than exhausted, disclose the sampling scope in the report's `## Workflow Deviations` footer.
Criticality: CRITICAL for missing headings/section starts, HIGH for paragraphs, MEDIUM for short
phrases.

**Step 3 — Heading level accuracy**: `crane heading --check "$PDF_FILE" "$MD_FILE"`. HIGH when off
by 2+ levels or an entire family is wrong; MEDIUM for a single isolated heading off by 1 level;
HIGH_CONFIDENCE when section numbering gives unambiguous evidence.

**Step 4 — Content nesting accuracy**: `crane nesting --check "$PDF_FILE" "$MD_FILE"`. HIGH when
nesting hierarchy is inverted; MEDIUM when off by one level.

**Step 5 — Table integrity**: `crane table --check "$PDF_FILE" "$MD_FILE"` — count rows/columns in
the PDF source, find the corresponding MD table by header-row keywords, verify row/column counts,
spot-check 3-5 cell values. Missing table entirely → CRITICAL; wrong cell data → HIGH.

**Step 6 — Figure/diagram coverage**: `crane figure --check "$PDF_FILE" "$MD_FILE"`. No
representation (no Mermaid, no placeholder) → HIGH; placeholder-only when type was determinable →
MEDIUM.

**Step 7 — Mermaid syntax validation (unless delegated)**: `crane mermaid --validate "$MD_FILE"` — validates 18 known
diagram type keywords, balanced brackets/parentheses, non-empty blocks. Invalid block → HIGH.

**Step 8 — OCR quality** (if applicable): `crane ocr --quality "$MD_FILE"` on `<!-- OCR: ... -->`
tagged sections, using 4 error patterns (non-ASCII runs, repeated l/I/1, repeated 0/O, long
concatenated words). Error rate >10% → CRITICAL, 5-10% → HIGH, 2-5% → MEDIUM.

**Step 9 — Structural fidelity**: major PDF sections are present as headings and section ordering
matches PDF reading order. Inverted order → HIGH. Generic H1/hierarchy mechanics are omitted when
`md-heading-hierarchy` is delegated.

**Step 10 — Finalize**: update status "In Progress" → "Complete"; add a summary (pages checked,
findings by criticality, dimensions checked, pass/needs-fixes recommendation).
