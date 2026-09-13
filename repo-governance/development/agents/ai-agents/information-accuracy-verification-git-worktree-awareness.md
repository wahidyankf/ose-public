---
description: "Explains why agents must use relative paths and re-read files fresh when running inside a git worktree, and gives the first four file-access rules."
when_to_use: Use when an agent spawned via the Agent tool needs to read or write files and may be running inside a worktree.
---

# Information Accuracy and Verification — Git Worktree Awareness

Agents spawned via the Agent tool (delegated agents) run with a working directory that may be a git worktree, not the main checkout. For example, the active worktree may be at `/Users/<name>/ose-projects/ose-public/.claude/worktrees/repo/` while the main checkout is at `/Users/<name>/ose-projects/ose-public/`. Reading a file using an absolute path from the main checkout returns stale content from the wrong tree and causes false verification failures.

**Rules for file access in agents**:

1. **Prefer relative paths** — Use paths relative to the current working directory when reading or writing files. This resolves correctly regardless of which worktree the agent runs in.
2. **Never hardcode main-checkout absolute paths** — Do not construct absolute paths by prepending the known main-checkout root (e.g., `/Users/<name>/ose-projects/ose-public/repo-governance/...`). These paths bypass the active worktree and return main-tree content.
3. **Read files fresh before verifying** — When a checker or fixer agent verifies that a fix was applied, it must read the file again from the current working directory. It must not rely on a previously cached read from a different path.
4. **Confirm the working directory when uncertain** — If an agent cannot determine which worktree it runs in, it should use `Bash` (`pwd`) to confirm the working directory before constructing any path.
