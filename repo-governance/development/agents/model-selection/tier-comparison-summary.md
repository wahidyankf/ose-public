---
description: "Summarizes the four model grades in one comparison table, including the model and effort the Tier Registry maps each to."
when_to_use: Use when you need a quick side-by-side comparison of the four model grades, or the effort a grade requires.
---

# Tier Comparison Summary

| Dimension                   | Ultra                                   | Planning-Grade              | Execution-Grade                       | Fast                        |
| --------------------------- | --------------------------------------- | --------------------------- | ------------------------------------- | --------------------------- |
| **`.claude/agents/` model** | `inherit` (unpinned)                    | `inherit` (unpinned)        | `sonnet`                              | `haiku`                     |
| **Reasoning depth**         | Frontier, long-horizon                  | Deep, multi-step            | Moderate, rule-based                  | Minimal, mechanical         |
| **Creativity**              | Highest (no prior art)                  | High (novel solutions)      | Low (follows templates)               | None (fixed procedures)     |
| **Task ambiguity**          | Handles problems with no known approach | Handles open-ended problems | Handles structured problems           | Requires deterministic flow |
| **Output originality**      | Invents the approach itself             | Creates new content/code    | Transforms per rules                  | Executes predefined steps   |
| **Error recovery**          | Recovers from unfamiliar states         | Adapts to unexpected states | Follows fallback rules                | Fails or retries            |
| **Typical agents**          | None yet — see the admission bar        | Creative makers, architects | Checkers, fixers, developers, testers | Link checkers, file manager |
| **Relative cost**           | 2× planning                             | 2.5× execution              | 2× fast                               | Baseline                    |
| **Effort**                  | none (unpinned)                         | none (unpinned)             | `xhigh`                               | `xhigh`                     |

Effort is a property of the tier, not of the individual agent: a weaker model is compensated with
more reasoning effort, so the pairing is a repository-wide rule rather than a per-agent judgement.
A canonical agent names only its `tier`. The Tier Registry in `repo-config.yml` pairs each pinned
tier's model with its effort, an unpinned tier sets neither, and `./rhino harness adapters generate`
writes both fields into each binding.

Cost multipliers compare the models a session typically selects, from the list prices in
[Current Model Versions](./current-model-versions.md) and are the reason each grade must be argued
for rather than assumed. Ultra currently has no members; see
[Model Tiers — Ultra](./model-tiers-ultra.md) for what admitting the first one requires.
