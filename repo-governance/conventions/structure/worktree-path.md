---
description: Defines the worktree directory structure, naming convention, and gitignore requirements for claude --worktree routing
when_to_use: Read this when creating, naming, or cleaning up a worktree, or configuring the WorktreeCreate hook.
---

# Worktree Path Convention

This convention establishes the worktree directory structure and routing convention for this repository, ensuring consistent worktree creation via `claude --worktree`.

## In This Convention

- [Principles, Purpose, Relationship to Delivery Mode, and Scope](./worktree-path/principles-purpose-relationship-to-delivery-mode-and-scope.md) — The principles this convention implements, why it exists, how it relates to the Delivery Mode concept...
- [Standards and Examples](./worktree-path/standards-and-examples.md) — required directory structure, hook routing mechanism, naming/gitignore requirements, and PASS/FAIL examples
- [Cleanup, Multiple Worktrees, Tools, and References](./worktree-path/worktree-cleanup-multiple-worktrees-tools-and-references.md) — removal procedure, AI/HUMAN tagging rule, and related documentation

## Platform Binding Compatibility and Industry Convention

### Platform Binding Compatibility

```binding-example
The WorktreeCreate hook is registered in ~/.claude/settings.json. The primary coding agent supports this hook event natively (see https://code.claude.com/docs/en/hooks for the field schema and transport contract); other coding agent platforms that support a `WorktreeCreate` hook with the same JSON-on-stdin contract reuse the same shell script without modification.
```

The hook script itself is platform-agnostic bash with `jq` for JSON parsing (`jq` is part of the doctor minimal toolchain per AGENTS.md), ensuring compatibility across platforms.

### Industry Convention vs. Chosen Approach

The dominant industry convention (per GitWorktree.org, Tower docs, Beej's Guide) places worktrees as **sibling directories** next to the main clone, not inside it:

```
~/projects/
├── myapp/                  # main worktree (original clone)
├── myapp-feature-auth/     # sibling worktree (outside repo)
```

This approach avoids nested-`.git` issues, keeps tools that walk up the directory tree happy, and is the most widely recommended pattern.

**Why `/worktrees/` inside the repo instead:**

- **Hook constraint**: The `WorktreeCreate` hook receives `cwd` (the project root) and resolves paths relative to it. Routing to a sibling path requires computing `..` from the repo root, which is messier and less portable across machines.
- **Dual-platform support**: A single hook registered in `~/.claude/settings.json` serves both platforms without duplication.
- **Simplicity**: Keeping worktrees inside the repo root makes `git worktree list` output scannable and keeps all repo-related state in one place.
- **Future-proofing**: If either platform adds native sibling-path support, this convention can be updated without changing the hook logic.

This is a deliberate pragmatic trade-off, not a lack of awareness of the sibling convention. Revisit if tooling problems emerge.
