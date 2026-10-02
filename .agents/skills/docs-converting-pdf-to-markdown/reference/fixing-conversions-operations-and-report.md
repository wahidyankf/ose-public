# Fixing PDF-to-Markdown Conversions: Fix Operations and Report Format

## Fix Operations

**Missing Section (CRITICAL)**: re-validate via `crane text --search`; if not found, extract by
page range via `crane pdf --extract` and insert at the correct location.

**Incorrect Text (CRITICAL)**: re-validate the incorrect text is still present; extract correct
text from the PDF page and replace, preserving surrounding Markdown formatting.

**Heading Level Accuracy (HIGH/MEDIUM)**: use `crane heading --infer "$HEADING_TEXT"` for
unambiguous depth from section numbering (count dots in `1.2.3` → depth 3 = H3), or font-size
heuristic if unnumbered. Replace the `#` prefix; verify surrounding headings aren't broken (no H4
before H3). HIGH_CONFIDENCE only when section numbering is unambiguous; font-size-only inference is
MEDIUM_CONFIDENCE (manual review).

**Content Nesting Accuracy (HIGH/MEDIUM)**: use `crane nesting --infer` to extract layout
indentation, reconstruct the hierarchy (e.g. indent 4 = level 1, indent 8 = level 2), rewrite the
list with correct nesting. HIGH_CONFIDENCE only when the PDF shows clear stepped indentation
(distinct column offsets); MEDIUM_CONFIDENCE when offsets are <3 columns apart.

**Missing Table (CRITICAL)**: re-validate via `crane table --check`; extract the table page, parse
column-aligned content, convert to a Markdown table, insert at the correct location.

**Invalid Mermaid Syntax (HIGH; non-delegated)**: locate the block, identify the syntax error (unknown type,
unclosed bracket, invalid arrow), apply a targeted fix — do NOT redesign the diagram, fix syntax
only.

**Missing Figure Placeholder (HIGH)**: re-validate via `crane figure --check`; insert `[FIGURE N:
description extracted from PDF caption — Mermaid conversion requires manual review]`.

**Missing Paragraph (HIGH)**: re-validate via `crane text --search`; extract the paragraph from the
PDF source page and insert after the identified anchor text.

## False Positive Persistence

`crane skiplist --add "$MD_BASENAME" --category "$CATEGORY" --description "$BRIEF_DESCRIPTION"` —
uses a SHA256 stable key for dedup, safe to call multiple times with the same arguments. Categories:
`text-completeness`, `text-accuracy`, `heading-level-accuracy`, `content-nesting-accuracy`,
`table-integrity`, `figure-coverage`, `mermaid-syntax`, `ocr-quality`, `structure`.

## Changed Sections Tracking

At the end of a fix run, write a `## Changed Sections` list (section titles/page ranges, tables,
Mermaid blocks, paragraphs touched) as evidence for each fix. It never narrows the checker's next
audit, which covers the whole frozen scope, per the
[Quality Gate Contract](../../../../repo-governance/development/workflow/quality-gate-contract.md).

## Fix Report Format

```markdown
# PDF-to-Markdown Fix Report

**Date**: YYYY-MM-DD HH:MM (UTC+7)
**Fixer**: pdf-to-md-fixer
**Source Audit**: local-tmp/pdf-to-md/pdf-to-md**{uuid}**audit.md
**UUID Chain**: {uuid-chain}

## Summary

- **Findings in Audit**: N
- **Applied (HIGH_CONFIDENCE)**: A
- **Skipped (MEDIUM_CONFIDENCE)**: B
- **False Positives**: C
- **Errors During Fix**: D

## Applied Fixes

### Fix 1: Missing Section "Section Title" (CRITICAL → Applied)

**Confidence**: HIGH
**Action**: Extracted pages 12-14 from PDF; inserted after "Previous Section" heading
**Result**: Section now present in MD

## Skipped Findings (Manual Review Required)

### Skipped: OCR Quality on Page 45 (MEDIUM_CONFIDENCE)

**Reason**: Cannot objectively determine if transcription error or valid content

## False Positives

### FALSE_POSITIVE: Missing Paragraph (page 23)

**Finding**: Checker reported paragraph absent
**Re-validation**: Paragraph present at line 892, whitespace-normalized match
**Action**: Added to `local-tmp/.known-false-positives.md` via `crane skiplist --add`

## Changed Sections

- Section "X" re-extracted from pages 12-14
- Mermaid block at line 445 syntax corrected
```
