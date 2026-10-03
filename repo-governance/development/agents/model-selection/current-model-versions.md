---
description: "States the current model versions in use as of September 2026."
when_to_use: Use when you need the current concrete model version string for a tier.
---

# Current Model Versions (September 2026)

| Grade     | Claude alias | Model ID                    | Context     | List price (in/out per MTok) |
| --------- | ------------ | --------------------------- | ----------- | ---------------------------- |
| Ultra     | `fable`      | `claude-fable-5-1`          | 1M tokens   | $10 / $50                    |
| Planning  | `opus`       | `claude-opus-5`             | 1M tokens   | $5 / $25                     |
| Execution | `sonnet`     | `claude-sonnet-5`           | 1M tokens   | $2 / $10                     |
| Fast      | `haiku`      | `claude-haiku-4-5-20251001` | 200k tokens | $1 / $5                      |

Aliases (`fable`, `opus`, `sonnet`, `haiku`) automatically track future model versions within each
grade, which is why the Tier Registry pins an alias and never the dated ID. It pins only `execution`
(`sonnet`) and `fast` (`haiku`); `ultra` and `plan` render `model: inherit`, so the first two rows
describe the models a session selects for that work rather than a pin. The concrete IDs
and prices above were verified against the vendor's published model overview on 2026-09-06.

The vendor's own guidance matches the grade ordering: start at the planning grade for most
workloads, and move up to ultra only when evaluations at the planning grade with higher `effort`
still fall short. That is the same admission bar
[Model Tiers — Ultra](./model-tiers-ultra.md) states.

Note the fast grade is the only one that is not a 1M-token context: an agent that must hold a large
working set does not belong there regardless of how mechanical its reasoning is.
