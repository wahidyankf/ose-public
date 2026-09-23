# Checking By-Example Format — Grouping, Compliance, Diagrams, Examples-by-Level

Validation checklist for `apps-ayokoding-www-by-example-checker` (continued).

## 5. Example Grouping

Thematic grouping (Basic, Error Handling, Advanced, etc.), progressive complexity within groups,
clear group headers.

## 6. ayokoding-web Compliance

Per `apps-ayokoding-www-developing-content`: bilingual content (id/en), content structure and
metadata, linking conventions.

## 7. Diagram Count

Total 30-50 across all levels (~35-60% of 75-85 examples): beginner 7-11 (25-37%), intermediate
8-17 (30-60%), advanced 10-24 (40-86%). Color palette: Blue `#0173B2`, Orange `#DE8F05`, Teal
`#029E73`, Purple `#CC78BC`, Brown `#CA9161`. Appropriate usage only for complex concepts (data
flow, state machines, concurrency).

## 8. Core Features First Principle

**Beginner** (CRITICAL): count external dependencies (imports not in standard library) — flag any
present, should be zero. External dependency = requires installation (npm/pip/Maven/etc.).
**Intermediate** (HIGH): for each dependency, check for a "Why Not Core Features" explanation —
flag if introduced without justification. **Advanced** (MEDIUM): check for trade-off comparisons
(core vs. external) and performance/complexity justifications.

## 9. Examples-by-Level Section in Overview (CRITICAL)

See the [Examples-by-Level Section rule](../../../repo-governance/conventions/tutorials/swe-by-example.md#examples-by-level-section-mandatory)
for the full standard. For each tutorial's `overview.md`:

1. **Presence** — MUST contain an `## Examples by Level` heading. Flag CRITICAL if absent.
2. **Coverage** — every `### Example N: Title` heading on every level page (`beginner.md` /
   `intermediate.md` / `advanced.md` / `production.md`) MUST appear as exactly one bullet. Flag
   CRITICAL for any missing or extra example.
3. **Verbatim text** — bullet link text MUST equal the heading text character-for-character. Flag
   HIGH for any divergence.
4. **Slug correctness** — anchor MUST equal `github-slugger`'s slug of the same heading; sanity-check
   via `node -e "import('github-slugger').then(m => console.log(new m.default().slug('<heading>')))"`.
   Flag HIGH for any mismatch.
5. **Path correctness** — link path MUST be `/en/learn/...<tutorial-base>/<level>` (no trailing
   slash, lowercase level). Flag MEDIUM for malformed paths.
6. **Subsection headings** — MUST be `### {Beginner|Intermediate|Advanced|Production} (Examples
N–M)` (en-dash, not hyphen). Flag LOW for deviations.

The link checker (`./rhino md internal-link validate`) validates no anchors and skips the published
content trees, so also flag any bullet pointing to a non-existent anchor (CRITICAL).

## Step-by-Step Validation Order

Count examples (flag if <75) → validate annotation density per example → validate five-part
structure → validate grouping → validate ayokoding-web compliance → validate Core Features First
per level → count and validate diagrams → validate the Examples-by-Level section → finalize report
with prioritized summary.
