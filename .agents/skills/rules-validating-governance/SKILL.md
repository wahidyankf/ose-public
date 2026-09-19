---
name: rules-validating-governance
description: Complete validation methodology for repository-wide governance consistency — file naming/linking/emoji, agent-Skill and Skill-to-Skill duplication/consolidation, governance word budgets, rules-governance contradictions/traceability/licensing/dependency-bump-policy, and software-engineering documentation quality. Used by rules-checker.
---

# Validating Repository Governance Rules

Methodology for `rules-checker`, which validates repository-wide consistency across all
governance layers, agent/Skill duplication, and software-engineering documentation.

## Reference Modules

1. [core-validation-and-agent-duplication.md](reference/core-validation-and-agent-duplication.md)
   and [skills-duplication-and-report-formats.md](reference/skills-duplication-and-report-formats.md) —
   Core Repository Validation (naming, linking, emoji, No-Last-Updated), Agent-to-Agent
   Duplication, Agent-Skill Duplication, Skill-to-Skill Consolidation, Skills Coverage Gaps, and
   the finding report formats.
2. [word-budget-and-rules-governance-core.md](reference/word-budget-and-rules-governance-core.md)
   and [rules-governance-licensing-and-dependency-policy.md](reference/rules-governance-licensing-and-dependency-policy.md) —
   governance word-budget delegation, contradictions/inaccuracies/inconsistencies, traceability,
   layer coherence, licensing compliance, dependency-bump policy compliance, Gherkin
   Gherkin journey coherence.
3. [software-docs-validation-8-1-to-8-4.md](reference/software-docs-validation-8-1-to-8-4.md)
   and [software-docs-validation-8-5-to-8-8.md](reference/software-docs-validation-8-5-to-8-8.md) —
   the eight `docs/explanation/software-engineering/` sub-checks (principle alignment,
   cross-references, naming, structure, templates, diagrams, README index, version docs).
4. [preflight-consumption.md](reference/preflight-consumption.md) and
   [execution-sequence-and-report-structure.md](reference/execution-sequence-and-report-structure.md) —
   consuming the deterministic `./rhino governance traceability validate` preflight JSON, the execution
   step sequence, and the final two-section report structure.

## Core Principles

**Lifecycle ownership**: in `rules-quality-gate`, exact `delegated-gate-ids` are omitted from the
domain scan. Missing/stale evidence is `pending`, never a local rerun or AI imitation. Retained
layer-coherence and traceability checks remain domain findings. Standalone behaviour is unchanged.
**Progressive writing**: every finding is written immediately, never buffered — Step 8
(~265 files) is the step most likely to be interrupted by compaction. **Conservative
consolidation**: when uncertain whether Skills should merge, recommend KEEP SEPARATE.

## Related

**Conventions**: all conventions in `repo-governance/conventions/`, all practices in
`repo-governance/development/`, [AI Agents Convention](../../../repo-governance/development/agents/ai-agents.md).

**Agents**: `rules-checker` (implements this methodology),
`rules-maker`.
