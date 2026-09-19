---
description: "The mandatory repo-grounding rule for presence claims."
when_to_use: "Use when a plan asserts something exists."
---

# Repo-Grounding Rule (HARD)

Every internal reference in a plan MUST be verified to exist in the current commit before being written. The verification command is encoded by the claim category in the table above.

**Verification recipe** (run BEFORE writing the claim):

```bash
# File path
test -f apps/ose-www/src/server/trpc.ts && echo OK

# Directory path
test -d repo-governance/conventions/writing/ && echo OK

# Symbol exists in codebase
rg -lE "(^|[^A-Za-z0-9_])unstable_cache([^A-Za-z0-9_]|$)" apps/ libs/

# Nx target defined
jq -r '.targets | keys[]' apps/ose-www/project.json | grep -q '^test:quick$' && echo OK

# Package version present in package.json
jq -r '.dependencies.next // .devDependencies.next' package.json

# Agent/skill exists
test -f .claude/agents/swe/swe-typescript-dev.md && echo OK
test -f .agents/skills/plan-creating-project-plans/SKILL.md && echo OK
```

If any verification fails, the author has three valid responses:

1. **Find the correct reference** (different file path, different target name) and re-verify.
2. **Mark the claim as `_New file_` / `_New target_`** if the plan creates it (and ensure the delivery checklist explicitly covers creation).
3. **Refuse the claim** — write `[Unverified]` and flag for follow-up, or omit entirely.

The forbidden response is to write the unverified claim as if it were a fact.
