#!/usr/bin/env bash
# Verify the remote-dispatch placement and refusal contract (RD-A2).
set -euo pipefail

repo_root=$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)

module="$repo_root/repo-governance/development/practice/resource-aware-development/remote-dispatch.md"
entrypoint="$repo_root/repo-governance/development/practice/resource-aware-development.md"
map="$repo_root/repo-governance/development/practice/resource-aware-development/README.md"

[[ -r "$module" ]] || {
	printf 'FAIL: remote-dispatch module is missing or unreadable\n' >&2
	exit 1
}

grep -Fq 'REMOTE_DISPATCH_HOME' "$module"
grep -Fq 'dispatch must not happen' "$module"
grep -Fq 'recorded' "$module"
grep -Fq 'refusal' "$module"
grep -Fq 'single HIPPO boundary' "$module"
grep -Fq 'placed on the target host' "$module"
grep -Fq 'before remote work' "$module"
grep -Fq 'delete it last' "$module"
grep -Fq 'public-outbound-safety.md' "$module"
grep -Fq 'no-secrets-in-committed-files.md' "$module"
grep -Fq 'no-machine-specific-commits.md' "$module"
grep -Fq 'remote-dispatch.md' "$entrypoint"
grep -Fq 'sits on the target' "$entrypoint"
grep -Fq 'remote-dispatch.md' "$map"
# Assertions use short phrases: proseWrap reflows long lines, so a long phrase can split. Keep each under ~20 characters.
grep -Fq 'max-worktree' "$module"
grep -Fq 'never suffices' "$module"

printf '%s\n' 'Remote-dispatch refusal contract: PASS'
