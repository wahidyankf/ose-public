#!/bin/bash
# WorktreeCreate hook — overrides default .claude/worktrees/ path
# Claude Code passes JSON as argv[1]; must print absolute path to stdout and exit 0
# Usage: WorktreeCreate '{"sessionId":"...","worktreeName":"...","workingDirectory":"..."}'

set -e

PAYLOAD="${1:-{\"worktreeName\":\"unnamed\"}}"

WORKTREE_NAME=$(echo "$PAYLOAD" | node -e "
  const d = process.argv[1];
  const o = JSON.parse(d);
  console.log(o.worktreeName || 'unnamed');
")

WORKING_DIR=$(echo "$PAYLOAD" | node -e "
  const d = process.argv[1];
  const o = JSON.parse(d);
  console.log(o.workingDirectory || process.cwd());
")

# Resolve parent repo root (where .git lives)
REPO_ROOT=$(cd "$WORKING_DIR" && git rev-parse --git-common-dir 2>/dev/null | sed 's/.git$//')

if [ -z "$REPO_ROOT" ]; then
  echo "Error: not a git repo: $WORKING_DIR" >&2
  exit 1
fi

# Create worktree at /worktrees/<name>/ in the repo root
WORKTREE_PATH="$REPO_ROOT/worktrees/$WORKTREE_NAME"

mkdir -p "$(dirname "$WORKTREE_PATH")"

# Check if worktree already exists
if git -C "$REPO_ROOT" worktree list | grep -qF "$WORKTREE_PATH"; then
  echo "Worktree already exists: $WORKTREE_PATH"
else
  git -C "$REPO_ROOT" worktree add "$WORKTREE_PATH" -b "worktree/$WORKTREE_NAME" 2>/dev/null || {
    echo "Using existing worktree path: $WORKTREE_PATH"
  }
fi

echo "$WORKTREE_PATH"
exit 0