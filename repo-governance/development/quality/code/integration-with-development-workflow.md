---
description: "How quality tooling fits the dev workflow."
when_to_use: "Use to see how quality tooling fits your workflow."
---

# Integration with Development Workflow

## Normal Workflow

```bash
# 1. Make changes to files
vim src/index.ts

# 2. Stage files
git add src/index.ts

# 3. Commit (hooks run automatically)
git commit -m "feat(api): add new endpoint"

# Hooks execute:
#  Prettier formats src/index.ts
#  Public-safety screen checks message
#  Commit succeeds

# 4. Push to remote (pre-push hook runs)
git push origin main

# Pre-push hook executes:
#  Nx detects affected projects
#  Runs test:quick for affected projects
#  Push succeeds
```

## When Hooks Modify Files

```bash
# 1. Stage and commit
git add src/messy.ts
git commit -m "fix: correct validation logic"

# Prettier formats messy.ts and stages it
# Commit includes formatted version automatically
```
