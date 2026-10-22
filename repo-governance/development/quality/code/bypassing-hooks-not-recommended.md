---
description: "Why bypassing a hook is discouraged."
when_to_use: "Use before bypassing a git hook."
---

# Bypassing Hooks (Not Recommended)

You can bypass git hooks using `--no-verify`:

```bash
git commit --no-verify -m "message"
```

**WARNING**: Only use this in exceptional circumstances:

- Emergency hotfixes where formatting can be fixed later
- When hooks are malfunctioning (report the issue)
- A guard stop before any check started, on a human-authorized push of a task-owned branch whose hosted gate mirrors
  the hook — see [Capacity-Held Hook](./capacity-held-hook.md)
- **NEVER** use this to avoid fixing code quality issues

Bypassing hooks regularly defeats the purpose of automated quality checks.
