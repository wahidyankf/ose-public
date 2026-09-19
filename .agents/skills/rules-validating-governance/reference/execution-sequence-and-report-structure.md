# Execution Sequence and Final Audit Report Structure

## Execution Sequence

Step 0 (initialize report — UUID/timestamp/progressive writing, see
`repo-generating-validation-reports` Skill) → Step 0.5 (preflight, above) → Step 1 (Core
Repository) → Step 2 (Agent-to-Agent Duplication) → Step 3 (Agent-Skill Duplication) → Step 4
(Skill-to-Skill Consolidation) → Step 5 (Skills Coverage Gaps) → Step 6 (Word Budget) → Step 7
(Rules Governance) → Step 8 (Software Docs) → Step 9 (Finalize: status → "Complete", summary
statistics per category — Core Repository, Agent-to-Agent, Agent-Skill, Skill Consolidation,
Skills Gaps, Word Budget, Rules Governance, Software Docs).

## Final Audit Report Structure

In a quality-gate invocation, the report has three top-level sections in fixed order:

1. **`## Deterministic Domain Findings`** — retained layer/traceability findings, grouped under
   per-category H3 headings mirroring `result.categories[]` order:

   ```markdown
   ### [SEVERITY] [CRITICALITY] <category> — <file>:<line>

   **Key**: `<category>|<file>|<short-hash>`
   **Message**: <message>
   **Source**: `./rhino governance <category> validate` (preflight)
   ```

   Skipped false-positives go under `### [INFO] Skipped (known false positives)`.

2. **`## AI-Only Findings`** — output of the AI-only sub-portions of Steps 1-8 (paraphrased
   duplication, contradictions, terminology alignment, semantic principle-appropriateness, README
   content quality, etc.), each using its step's finding format.
3. **`## Lifecycle Evidence`** — exact delegated IDs, owner surface, evidence coordinates, and
   `verified`/`pending`/`not-applicable`; never copied into the domain finding total.

Standalone invocation retains its existing preflight/fallback report behaviour.

## Important Notes

**Progressive writing** is mandatory for every step, not just Step 8 — findings written
immediately survive compaction; buffered findings don't.

**Duplication detection accuracy**: favor high-confidence matches; false positives are acceptable
since the fixer re-validates before applying.

**Performance**: Agent-Skill comparison is O(agents × skills); Agent-to-Agent and Skill-to-Skill
are O(n²/2) — use efficient text matching, never character-by-character.

**Thresholds**: only suggest a new Skill for patterns in 3+ agents; only suggest Skill
consolidation when benefits clearly outweigh risk (combined <2000 lines, high cohesion, always used
together) — when uncertain, KEEP SEPARATE.
