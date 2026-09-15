---
description: "Prohibits per-repo [user] overrides in .git/config; git author identity must come exclusively from the global git config"
when_to_use: "Read this index to find the right Git Identity From Global Config Convention child document."
---

# Git Identity From Global Config Convention

- [Principles and Conventions Implemented](./principles-and-conventions-implemented.md) — The principles and companion convention the Git Identity From Global Config Convention implements and respects. Use when tracing why per-repo git identity overrides are prohibited back to the principles and conventions this rule respects.
- [Standards](./standards.md) — The three standards governing git identity — no per-repo [user] section, global-config-only resolution, and behavioural guardrail enforcement. Use when checking whether a `.git/config` state, an `includeIf` setup, or an enforcement mechanism complies with this convention.
- [Examples](./examples.md) — PASS and FAIL examples of git identity configuration — a clean global identity, a per-repo override violation, and a compliant multi-identity includeIf setup. Use when verifying whether a specific `.git/config` and `~/.gitconfig` combination passes or fails this convention.
- [Remediation and Sibling Repos](./remediation-and-sibling-repos.md) — The commands to remove an existing per-repo [user] override, and how the behavioural guardrail applies across the sibling repositories. Use when an existing `[user]` override must be removed, or when verifying the guardrail's coverage across ose-public and the private sibling.
