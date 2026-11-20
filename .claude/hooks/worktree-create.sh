#!/bin/bash
# WorktreeCreate hook — overrides Claude Code's default `.claude/worktrees/` path.
#
# Protocol (per https://code.claude.com/docs/en/hooks):
#   - Input: JSON payload via STDIN, fields { "hook_event_name", "cwd", "name" }.
#   - Output: absolute path of the created worktree on stdout (last line).
#   - stderr: any informational/diagnostic output (does not interfere with the path).
#   - Exit: 0 on success; non-zero fails worktree creation.
#
# Behaviour: routes worktrees to `<repo-root>/worktrees/<name>/` in the parent repo
# of `cwd`, so they sit at the repo root rather than under `.claude/`.
#
# Deference: Claude Code runs hooks from every settings level in parallel, so this user-level hook also runs
# in a repo that declares its own WorktreeCreate hook. When the main repo's `.claude/settings.json` declares a
# WorktreeCreate command that does not run this script, this hook creates nothing. It prints the same
# `<repo-root>/worktrees/<name>` path as the last stdout line, notes the deferral on stderr, and exits 0, so
# the repo's own hook builds the worktree. Only that declaration decides. A missing or unreadable settings file,
# invalid JSON, no WorktreeCreate key, an empty list, or only registrations of this script keep the default.

set -e

# This script's file name. A registered command that names it runs this script, whatever spelling
# ($CLAUDE_PROJECT_DIR, absolute, or relative) precedes the name.
SELF_NAME=${BASH_SOURCE[0]##*/}
SELF_NAME=${SELF_NAME:-worktree-create.sh}

# is_self_command COMMAND — succeeds when COMMAND runs this script.
is_self_command() {
	case "$1" in
	*"$SELF_NAME"*) return 0 ;;
	*) return 1 ;;
	esac
}

# repo_declares_foreign_worktree_hook SETTINGS — succeeds when SETTINGS declares a WorktreeCreate hook whose
# command does not run this script. Every read or parse failure reads as "no", so the caller keeps the
# default behaviour. Entries use Claude Code's nested shape, and a flat entry with a top-level command is
# also read.
repo_declares_foreign_worktree_hook() {
	local settings=$1 commands command
	[ -f "$settings" ] || return 1
	jq -e '(.hooks.WorktreeCreate // []) | length > 0' "$settings" >/dev/null 2>&1 || return 1
	commands=$(jq -r '
		(.hooks.WorktreeCreate // [])[]? | select(type == "object") |
		(((.hooks // [])[]? | select(type == "object") | .command) // empty), (.command // empty)
	' "$settings" 2>/dev/null) || return 1
	while IFS= read -r command; do
		[ -n "$command" ] || continue
		if ! is_self_command "$command"; then
			return 0
		fi
	done <<<"$commands"
	return 1
}

# Read JSON payload from stdin.
INPUT=$(cat)

# Defensive: if Claude Code passes nothing or an empty stdin, treat as empty object.
if [ -z "$INPUT" ]; then
	INPUT='{}'
fi

# Parse with jq (present in the doctor minimal scope per AGENTS.md).
NAME=$(printf '%s' "$INPUT" | jq -r '.name // empty' 2>/dev/null || true)
CWD=$(printf '%s' "$INPUT" | jq -r '.cwd // empty' 2>/dev/null || true)

# Auto-generate a name when missing so `claude --worktree` (no positional arg) still works.
if [ -z "$NAME" ] || [ "$NAME" = "null" ]; then
	NAME="auto-$(date +%Y%m%d-%H%M%S)"
fi

# Default cwd to the current shell pwd.
if [ -z "$CWD" ] || [ "$CWD" = "null" ]; then
	CWD="$(pwd)"
fi

# Resolve the main repo root (parent of the common .git). Works whether `cwd` is the
# main checkout or sits inside an existing worktree.
GIT_COMMON_DIR=$(cd "$CWD" 2>/dev/null && git rev-parse --git-common-dir 2>/dev/null) || {
	echo "WorktreeCreate hook: not a git repo: $CWD" >&2
	exit 1
}
GIT_COMMON_DIR=$(cd "$CWD" && cd "$GIT_COMMON_DIR" && pwd)
REPO_ROOT=$(dirname "$GIT_COMMON_DIR")

# Custom path: <repo-root>/worktrees/<name>/
WORKTREE_PATH="$REPO_ROOT/worktrees/$NAME"

# Defer when the repo declares its own WorktreeCreate hook: that hook builds the worktree at this same path.
if repo_declares_foreign_worktree_hook "$REPO_ROOT/.claude/settings.json"; then
	echo "WorktreeCreate hook: $REPO_ROOT declares its own WorktreeCreate hook; deferring worktree/$NAME to it" >&2
	printf '%s\n' "$WORKTREE_PATH"
	exit 0
fi

mkdir -p "$(dirname "$WORKTREE_PATH")"

# Create the worktree if it does not already exist. Branch follows the worktrees/<name>
# convention; existing branch is reused on rerun.
if ! git -C "$REPO_ROOT" worktree list --porcelain | grep -qF "worktree $WORKTREE_PATH"; then
	if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/worktree/$NAME"; then
		git -C "$REPO_ROOT" worktree add "$WORKTREE_PATH" "worktree/$NAME" >&2 2>/dev/null || true
	else
		git -C "$REPO_ROOT" worktree add "$WORKTREE_PATH" -b "worktree/$NAME" >&2 2>/dev/null || true
	fi
fi

# Final line on stdout MUST be the absolute worktree path.
printf '%s\n' "$WORKTREE_PATH"
exit 0
