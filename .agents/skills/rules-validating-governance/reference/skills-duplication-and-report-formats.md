# Steps 3-5: Agent-Skill Duplication, Consolidation, Coverage Gaps, and Report Formats

## Step 3: Agent-Skill Duplication Detection

**Deterministic-gate annotation**: verbatim agent/skill duplication is caught by `Rhino
harness` — re-evaluate only paraphrased/non-verbatim agent-Skill duplication.

For each agent, extract content blocks and compare against every Skill in `.agents/skills/`,
detecting verbatim/paraphrased/conceptual duplication and assessing criticality identically to
Step 2's scale. Common patterns to check: UUID generation logic (→
`repo-generating-validation-reports`), criticality definitions (→
`repo-assessing-criticality-confidence`), mode-parameter handling (→
`repo-applying-maker-checker-fixer`), content organization (→
`apps-ayokoding-www-developing-content`), color palettes (→ `docs-creating-accessible-diagrams`),
report templates (→ `repo-generating-validation-reports`), annotation density (→
`docs-creating-by-example-tutorials`).

## Step 4: Skill-to-Skill Consolidation Analysis

Read all Skills (exclude README.md), extract description/line-count/name-pattern/cross-references/
topic headings, and group by pattern:

- **Workflow Family**: `[prefix]-[stage]-workflow` naming covering sequential stages (3+ Skills).
- **Name Prefix Clustering**: shared prefix (`repo-*`, `docs-*`, `apps-*`, `plan-*`, `agent-*`)
  with related suffixes (2+ Skills).
- **Tiny Skill Detection**: Skills <100 lines heavily referencing a larger related Skill.
- **Topic Similarity**: 2+ Skills sharing >60% of description/heading topic keywords.
- **Sequential Dependency**: bidirectional heavy cross-referencing ("See X for..." / "See Y
  for...", >3 references each way).

**Assess each group** on: size (PASS <2000 combined lines, CONCERN 2000-3000, FAIL >3000),
cohesion (high = sequential workflow stages; medium = related but orthogonal; low = incidentally
related), usage pattern (checked via agent frontmatter — always/sometimes/rarely used together),
and progressive-disclosure benefit.

**Criticality**: CRITICAL (5+ related Skills that should be 1-2), HIGH (3-4 Skills >70% overlap,
combined <2000 lines), MEDIUM (2 Skills 50-70% overlap, trade-offs exist), LOW (optimization
suggestion, unclear benefit).

**Domain-specific exemptions — never flag**: `apps-ayokoding-www-developing-content` vs.
`apps-ose-www-developing-content` (different audiences/content despite both using Next.js 16);
`repo-assessing-criticality-confidence` vs. `repo-generating-validation-reports` (orthogonal
concerns — what to assess vs. how to report).

**Be conservative**: when unsure, recommend KEEP SEPARATE.

## Step 5: Skills Coverage Gap Analysis

Find content blocks repeated across 3+ agents with no existing Skill covering the pattern.
**Criticality**: CRITICAL (10+ agents, no Skill), HIGH (5-9 agents), MEDIUM (3-4 agents), LOW (2
agents, not yet worth extracting).

## Report Formats

**Core/general finding**: `### Finding: [type]` with Category, Files Affected, Criticality, Issue,
Evidence, Recommendation.

**Duplication finding**: `### Finding: Agent-Skill Duplication` (or Agent-to-Agent) with
Agent/Skill names, Criticality, Type (Verbatim/Paraphrased/Conceptual), Lines Duplicated,
Duplicated Content sample, and a Recommendation naming the target Skill plus the specific 3-step
fix (remove duplicated lines → add Skill to frontmatter → add a one-line "See `[skill]` for
[topic]" reference).

**Gap finding**: `### Finding: Skills Coverage Gap` with Pattern, Appears In (agent list),
Criticality, Estimated Lines, Pattern Examples, Recommendation (create new Skill or extend
existing).

**Consolidation finding**: `### Finding: Skill Consolidation Opportunity` with Skills Involved,
Criticality, Pattern Type, Current State (sizes, cross-references), Overlap Analysis, Benefits/
Risks of Merging, Recommendation (MERGE / CONSIDER MERGE / KEEP SEPARATE) with rationale and — if
MERGE — a proposed merged-file section outline.
