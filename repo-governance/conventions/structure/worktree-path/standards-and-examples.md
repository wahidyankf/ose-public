---
description: The required worktree directory structure, hook routing mechanism, naming and gitignore requirements, plus PASS/FAIL examples for hook registration, worktree paths, and hook file naming
when_to_use: Read this when creating or reviewing a WorktreeCreate hook, choosing a worktree path, or checking a worktree/hook filename against PASS/FAIL examples.
---

# Worktree Path: Standards and Examples

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
- **Protocol**: reads a JSON payload from **stdin** with fields `hook_event_name`, `cwd`, `name`; prints the absolute worktree path to stdout (last line); writes any informational output to stderr; exits `0` on success (non-zero fails creation). The exact field names and stdin transport are dictated by the coding agent platform under which the hook runs — see Platform Binding Compatibility below for the binding-specific reference.
- **Behaviour**: routes the new worktree to `<repo-root>/worktrees/<name>/` instead of the default `.claude/worktrees/<name>/`.

**Hook contract:**

```bash
# Input: JSON payload on stdin, e.g.
#   {"hook_event_name":"WorktreeCreate","cwd":"/path/to/project","name":"my-feature"}
#
# Bash idiom for parsing:
INPUT=$(cat)
NAME=$(printf '%s' "$INPUT" | jq -r '.name // empty')
CWD=$(printf '%s' "$INPUT" | jq -r '.cwd // empty')

# Output: absolute path of the created worktree on stdout (last line)
echo "/path/to/repo/worktrees/$NAME"

# Exit code: 0 on success; non-zero fails worktree creation
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
FAIL: ../myapp-worktrees/feature-auth/   # Sibling worktree locations are forbidden
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
