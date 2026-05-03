---
title: "Worktree Path Convention"
description: Defines the worktree directory structure, naming convention, and gitignore requirements for claude --worktree routing
category: explanation
subcategory: conventions
tags:
  - worktree
  - git
  - repository-structure
  - claude
  - hooks
created: 2026-05-03
---

# Worktree Path Convention

This convention establishes the worktree directory structure and routing convention for this repository, ensuring consistent worktree creation via `claude --worktree`.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Worktree paths are explicitly routed via hook rather than relying on defaults. The routing behavior is documented and reproducible.

- **[Reproducibility First](../../principles/software-engineering/reproducibility.md)**: All worktrees are created in a predictable location (`worktrees/<name>/`) with consistent naming, ensuring reliable git operations and CI/CD integration.

## Purpose

Standardize worktree creation so that `claude --worktree <name>` routes to `worktrees/<name>/` in the repository root (not the default `.claude/worktrees/`). This keeps worktrees visible at the repo root level while gitignoring both the conventional and custom paths.

## Scope

### What This Convention Covers

- **Worktree routing** — Override default `.claude/worktrees/` path to `worktrees/<name>/`
- **Hook mechanism** — `WorktreeCreate` hook implementation
- **Naming convention** — Hook file naming (kebab-case `.sh`)
- **Gitignore requirements** — Both worktree directories gitignored
- **Worktree creation pattern** — How new worktree rules should be added

### What This Convention Does NOT Cover

- **Git worktree low-level operations** — Internal git mechanics (handled by git documentation)
- **Hook development standards** — General hook development (see separate conventions)
- **Worktree naming for users** — User-facing worktree naming guidance (handled by user documentation)

## Standards

### Worktree Directory Structure

Worktrees created via `claude --worktree` MUST be placed under `worktrees/<name>/` in the repository root:

```
<repo-root>/
├── worktrees/              # Custom worktree location
│   └── <name>/             # Individual worktree directories
│       └── (worktree files)
├── .claude/
│   └── worktrees/         # Default location (gitignored, unused)
└── .gitignore              # Both paths must be gitignored
```

### Routing Mechanism

Worktree creation is routed via a `WorktreeCreate` hook:

- **Location**: `.claude/hooks/worktree-create.sh`
- **Naming**: kebab-case with `.sh` extension
- **Protocol**: Accepts JSON payload as `argv[1]`, prints absolute path to stdout, exits `0`
- **Behavior**: Resolves `worktrees/<name>/` in the repo root instead of `.claude/worktrees/<name>/`

**Hook contract:**

```bash
# Input: JSON payload via argv[1]
WorktreeCreate '{"sessionId":"...","worktreeName":"...","workingDirectory":"..."}'

# Output: Absolute path to stdout
# /path/to/repo/worktrees/<name>

# Exit code: 0 on success
```

### Naming Requirements

Worktree hook files MUST follow the pattern:

- **Format**: `<hook-type>.sh` (kebab-case, lowercase)
- **Example**: `worktree-create.sh` (WorktreeCreate hook type)
- **Location**: Always under `.claude/hooks/`

### Gitignore Requirements

Both worktree directories MUST be gitignored:

```gitignore
# .gitignore

# Default Claude worktree location (unused but gitignored for safety)
.claude/worktrees/

# Custom worktree location (active)
worktrees/
```

## Examples

### Correct Hook Registration

```json
// ~/.claude/settings.json (global user config)
{
  "hooks": {
    "WorktreeCreate": "/path/to/repo/.claude/hooks/worktree-create.sh"
  }
}
```

### Good Worktree Path

```
PASS: worktrees/feature-auth/
PASS: worktrees/bugfix-session-timeout/
PASS: worktrees/experiment-new-api/
```

### Bad Worktree Path

```
FAIL: .claude/worktrees/feature-auth/    # Wrong location (default)
FAIL: feature-auth/                     # Missing worktrees/ prefix
FAIL: worktrees/FeatureAuth/            # PascalCase (should be kebab-case)
```

### Hook File Naming

```
PASS: worktree-create.sh        # kebab-case + .sh extension
FAIL: worktreeCreate.sh          # camelCase
FAIL: WorktreeCreate.sh          # PascalCase
FAIL: worktree-create           # missing .sh extension
```

## Special Considerations

### Platform Binding Compatibility

```binding-example
The WorktreeCreate hook is registered in ~/.claude/settings.json. The coding agent reads skills and definitions natively and supports Claude Code hooks, so a single hook serves both platforms.
```

The hook script itself is platform-agnostic bash with Node.js for JSON parsing, ensuring compatibility across platforms.

### Industry Convention vs. Chosen Approach

The dominant industry convention (per GitWorktree.org, Tower docs, Beej's Guide) places worktrees as **sibling directories** next to the main clone, not inside it:

```
~/projects/
├── myapp/                  # main worktree (original clone)
├── myapp-feature-auth/     # sibling worktree (outside repo)
```

This approach avoids nested-`.git` issues, keeps tools that walk up the directory tree happy, and is the most widely recommended pattern.

**Why `/worktrees/` inside the repo instead:**

- **Hook constraint**: The `WorktreeCreate` hook receives `workingDirectory` (the repo root) and resolves paths relative to it. Routing to a sibling path requires computing `..` from repo root, which is messier and less portable across machines.
- **Dual-platform support**: A single hook registered in `~/.claude/settings.json` serves both platforms without duplication.
- **Simplicity**: Keeping worktrees inside the repo root makes `git worktree list` output scannable and keeps all repo-related state in one place.
- **Future-proofing**: If either platform adds native sibling-path support, this convention can be updated without changing the hook logic.

This is a deliberate pragmatic trade-off, not a lack of awareness of the sibling convention. Revisit if tooling problems emerge.

### Worktree Cleanup

When removing a worktree:

1. Remove the worktree directory: `rm -rf worktrees/<name>/`
2. Prune the git worktree reference: `git worktree prune`
3. Optionally remove the branch: `git branch -D worktree/<name>`

### Multiple Worktrees

The pattern supports multiple concurrent worktrees:

```
worktrees/
├── feature-auth/
├── bugfix-session-timeout/
└── experiment-new-api/
```

## Tools and Automation

Reference agents or tools that interact with this convention:

- **WorktreeCreate hook** (`.claude/hooks/worktree-create.sh`) — Routes `claude --worktree` to custom path
- **repo-rules-checker** — Validates worktree-related rules and gitignore compliance

## References

**Related Conventions:**

- [File Naming Convention](./file-naming.md) — Kebab-case file naming standards
- [Agent Naming Convention](./agent-naming.md) — Agent file naming patterns
- [Workflow Naming Convention](./workflow-naming.md) — Workflow file naming patterns

**Related Documentation:**

- [AGENTS.md](../../../AGENTS.md) — agent configuration
- [Repository Governance Architecture](../../repository-governance-architecture.md) — Six-layer governance hierarchy
