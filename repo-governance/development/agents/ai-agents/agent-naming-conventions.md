---
description: "Scope-prefix guidance for agent definition filenames, and the naming rule that no longer binds them."
when_to_use: Use when naming or renaming an agent definition file.
---

# Agent Naming Guidance

Agent filenames are ordinary lowercase kebab-case, per
[File Naming](../../../conventions/structure/file-naming.md). Nothing else is mandatory.

The former Agent Naming Convention required every basename to parse as
`<scope>(-<qualifier>)*-<role>` with `role` drawn from a closed vocabulary, and a validator enforced
it. Both were withdrawn — the check compared only a basename's last token against a list, so it
never prevented a real defect while forcing a rename whenever a new kind of agent appeared. See
[Withdrawn Rules](../../../conventions/structure/file-naming.md#withdrawn-rules). No existing agent
filename changed, so the names below are still what you will find on disk.

## Scope Prefixes Are Guidance, Not a Grammar

Most agents carry a leading scope token because it groups the catalog usefully, not because a rule
demands it. Follow it when it helps a reader find the agent.

**Use a scope prefix when the agent works only within one app or library:**

- `apps-<app-name>-` — content creation, validation, or deployment for a single app.
  Examples: `apps-ayokoding-www-general-maker`, `apps-ose-www-deployer`.
- `libs-<lib-name>-` — work confined to one library.
  Examples: `libs-ts-auth-validator`, `libs-ts-payment-checker`.

**Skip the prefix when the agent is not app-scoped:**

- Repository-wide agents — `docs-maker`, `rules-checker`, `plan-execution-checker`.
- Cross-cutting agents spanning several apps — `readme-maker`, `agent-maker`,
  `repo-workflow-maker`.
- Meta-agents managing repository structure — `docs-file-manager`, `rules-maker`.

**When you do use a scope:**

- Match the directory name exactly — `ayokoding-www` for `apps/ayokoding-www/`.
- Stay kebab-case throughout; hyphens separate every part. No camelCase, PascalCase, or
  underscores — the file naming convention still forbids those.

## Trailing Role Tokens

Names like `-maker`, `-checker`, `-fixer`, `-dev`, and `-deployer` describe what an agent does and
recur throughout the catalog. They remain useful shorthand and the colour and accessibility
guidance elsewhere in this document leans on them. They are descriptive: an agent whose job has no
matching token needs no new token and no exception.

## Related

- [File Naming](../../../conventions/structure/file-naming.md) — the kebab-case base rule.
- [Agent catalog](../../../../.agents/agents/README.md) — the authoritative list of agents.
