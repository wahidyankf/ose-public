#!/usr/bin/env bash
# Test suite for block-env-file-access.sh
# Usage: bash .claude/hooks/block-env-file-access.test.sh
set -euo pipefail

HOOK=".claude/hooks/block-env-file-access.sh"
PASS=0
FAIL=0

assert_deny() {
	local label="$1"
	local input="$2"
	local output
	output="$(printf '%s' "$input" | bash "$HOOK")"
	if printf '%s' "$output" | jq -e '.hookSpecificOutput.permissionDecision=="deny"' >/dev/null 2>&1; then
		echo "PASS [DENY] $label"
		PASS=$((PASS + 1))
	else
		echo "FAIL [DENY] $label — expected deny, got: $output"
		FAIL=$((FAIL + 1))
	fi
}

assert_allow() {
	local label="$1"
	local input="$2"
	local output
	output="$(printf '%s' "$input" | bash "$HOOK")"
	if [ -z "$output" ]; then
		echo "PASS [ALLOW] $label"
		PASS=$((PASS + 1))
	else
		echo "FAIL [ALLOW] $label — expected empty output, got: $output"
		FAIL=$((FAIL + 1))
	fi
}

# File-tool ALLOW cases — named-file rule: only .env.prod / .env.stag are restricted.
assert_allow "Read .env" \
	'{"tool_name":"Read","tool_input":{"file_path":".env"}}'

assert_allow "Read .env.local" \
	'{"tool_name":"Read","tool_input":{"file_path":".env.local"}}'

assert_allow "Read .env.test" \
	'{"tool_name":"Read","tool_input":{"file_path":".env.test"}}'

assert_allow "Write apps/coralpolyp-be/.env.local" \
	'{"tool_name":"Write","tool_input":{"file_path":"apps/coralpolyp-be/.env.local"}}'

assert_allow "Edit .env.production" \
	'{"tool_name":"Edit","tool_input":{"file_path":".env.production"}}'

assert_allow "Write .env.whatever" \
	'{"tool_name":"Write","tool_input":{"file_path":".env.whatever"}}'

assert_allow "Read .env.example" \
	'{"tool_name":"Read","tool_input":{"file_path":".env.example"}}'

assert_allow "Write apps/coralpolyp-fe/.env.example" \
	'{"tool_name":"Write","tool_input":{"file_path":"apps/coralpolyp-fe/.env.example"}}'

# File-tool DENY cases — the two restricted tiers, across Read/Edit/Write.
assert_deny "Read .env.prod" \
	'{"tool_name":"Read","tool_input":{"file_path":".env.prod"}}'

assert_deny "Edit .env.prod" \
	'{"tool_name":"Edit","tool_input":{"file_path":".env.prod"}}'

assert_deny "Write .env.prod" \
	'{"tool_name":"Write","tool_input":{"file_path":".env.prod"}}'

assert_deny "Read .env.stag" \
	'{"tool_name":"Read","tool_input":{"file_path":".env.stag"}}'

assert_deny "Edit .env.stag" \
	'{"tool_name":"Edit","tool_input":{"file_path":".env.stag"}}'

assert_deny "Write .env.stag" \
	'{"tool_name":"Write","tool_input":{"file_path":".env.stag"}}'

# Bash ALLOW cases — named-file rule.
assert_allow "Bash cat .env.example" \
	'{"tool_name":"Bash","tool_input":{"command":"cat .env.example"}}'

assert_allow "Bash bash scripts/setup-env.sh" \
	'{"tool_name":"Bash","tool_input":{"command":"bash scripts/setup-env.sh"}}'

assert_allow "Bash ./rhino repo-config validate" \
	'{"tool_name":"Bash","tool_input":{"command":"./rhino repo-config validate"}}'

assert_allow "Bash npm run setup:env" \
	'{"tool_name":"Bash","tool_input":{"command":"npm run setup:env"}}'

assert_allow "Bash cat .env.local" \
	'{"tool_name":"Bash","tool_input":{"command":"cat .env.local"}}'

assert_allow "Bash echo > .env.local" \
	'{"tool_name":"Bash","tool_input":{"command":"echo X > .env.local"}}'

assert_allow "Bash git add .env.local" \
	'{"tool_name":"Bash","tool_input":{"command":"git add .env.local"}}'

# Bash DENY cases — the two restricted tiers only.
assert_deny "Bash cat .env.prod" \
	'{"tool_name":"Bash","tool_input":{"command":"cat .env.prod"}}'

assert_deny "Bash head -5 infra/x/.env.prod" \
	'{"tool_name":"Bash","tool_input":{"command":"head -5 infra/x/.env.prod"}}'

assert_deny "Bash cp .env.stag /tmp/x" \
	'{"tool_name":"Bash","tool_input":{"command":"cp .env.stag /tmp/x"}}'

assert_deny "Bash echo K=v > .env.prod" \
	'{"tool_name":"Bash","tool_input":{"command":"echo K=v > .env.prod"}}'

assert_deny "Bash git add .env.prod" \
	'{"tool_name":"Bash","tool_input":{"command":"git add .env.prod"}}'

# Regression: ALLOW_PATTERN must not let a restricted-tier target under apps/|libs/|scripts/
# bypass the deny checks — this is the realistic case, since real env files live under apps/.
assert_deny "Bash redirect apps/-path .env.prod (ALLOW_PATTERN bypass regression)" \
	'{"tool_name":"Bash","tool_input":{"command":"printf X > apps/ose-www/.env.prod"}}'

assert_deny "Bash cat apps/-path .env.prod (ALLOW_PATTERN bypass regression)" \
	'{"tool_name":"Bash","tool_input":{"command":"cat apps/ose-www/.env.prod"}}'

assert_deny "Bash git add libs/-path .env.stag (ALLOW_PATTERN bypass regression)" \
	'{"tool_name":"Bash","tool_input":{"command":"git add libs/x/.env.stag"}}'

# Content-fixture exclusion (guard-env-file-access §9) — regression pins.
# Course fixtures named <word>.env under apps/<app>/content/** are curriculum
# material, never real secrets; allowed under both the old and new policy.
assert_allow "Bash cat apps/<app>/content/**/kata.env" \
	'{"tool_name":"Bash","tool_input":{"command":"cat /r/apps/ayokoding-www/content/en/c/kata.env"}}'

assert_allow "Bash cat worktree apps/<app>/content/**/app.env" \
	'{"tool_name":"Bash","tool_input":{"command":"cat /r/worktrees/wt/apps/ayokoding-www/content/en/c/app.env"}}'

assert_allow "Bash redirect into apps/<app>/content/**/kata.env" \
	'{"tool_name":"Bash","tool_input":{"command":"echo FOO=bar > /r/apps/ayokoding-www/content/en/c/kata.env"}}'

assert_allow "Read apps/<app>/content/**/kata.env" \
	'{"tool_name":"Read","tool_input":{"file_path":"/r/apps/ayokoding-www/content/en/c/kata.env"}}'

# Formerly-denied dotfile/near-.env cases — now allowed too, since only
# .env.prod / .env.stag are restricted anywhere under the named-file rule.
assert_allow "Bash cat apps/<app>/content/**/.env (dotfile)" \
	'{"tool_name":"Bash","tool_input":{"command":"cat /r/apps/ayokoding-www/content/en/c/.env"}}'

assert_allow "Read apps/<app>/content/**/.env.local (dotfile)" \
	'{"tool_name":"Read","tool_input":{"file_path":"/r/apps/ayokoding-www/content/en/c/.env.local"}}'

assert_allow "Bash cat apps/<app>/src/secrets.env (not a restricted tier)" \
	'{"tool_name":"Bash","tool_input":{"command":"cat /r/apps/coralpolyp-be/src/secrets.env"}}'

assert_allow "Bash echo X > /abs/path/.env.local" \
	'{"tool_name":"Bash","tool_input":{"command":"echo X > /r/apps/coralpolyp-be/.env.local"}}'

# SEC-1 regressions — default-deny closes the verb-enumeration gap: any command whose text
# references a restricted tier is denied, regardless of which tool/verb touches it.
assert_deny "Bash python3 opening .env.prod (SEC-1, verb not on any enumerated blocklist)" \
	'{"tool_name":"Bash","tool_input":{"command":"python3 -c import_shim -- .env.prod"}}'

assert_deny "Bash rsync .env.prod exfil (SEC-1)" \
	'{"tool_name":"Bash","tool_input":{"command":"rsync .env.prod /tmp/exfil/"}}'

assert_deny "Bash awk on .env.stag (SEC-1)" \
	'{"tool_name":"Bash","tool_input":{"command":"awk 1 .env.stag"}}'

assert_deny "Bash xxd on .env.prod (SEC-1)" \
	'{"tool_name":"Bash","tool_input":{"command":"xxd .env.prod"}}'

assert_deny "Bash variable-indirection cat \"\$F\" where F=.env.prod (SEC-1)" \
	'{"tool_name":"Bash","tool_input":{"command":"F=.env.prod; cat \"$F\""}}'

# SEC-3 regressions — matching is case-insensitive, so a case-insensitive-filesystem alias
# (.ENV.PROD resolving to the same inode as .env.prod) cannot bypass the guard.
assert_deny "Bash cat .ENV.PROD (SEC-3 case bypass)" \
	'{"tool_name":"Bash","tool_input":{"command":"cat .ENV.PROD"}}'

assert_deny "Read apps/ose-www/.ENV.PROD (SEC-3 case bypass)" \
	'{"tool_name":"Read","tool_input":{"file_path":"apps/ose-www/.ENV.PROD"}}'

assert_deny "Bash CAT .Env.Stag mixed case (SEC-3 case bypass)" \
	'{"tool_name":"Bash","tool_input":{"command":"cat .Env.Stag"}}'

# SEC-4 — Grep/Glob now get the same file-tool coverage as Read/Edit/Write/MultiEdit.
assert_deny "Grep pattern with path=.env.prod (SEC-4)" \
	'{"tool_name":"Grep","tool_input":{"pattern":"foo","path":".env.prod"}}'

assert_deny "Glob path=.env.stag (SEC-4)" \
	'{"tool_name":"Glob","tool_input":{"pattern":"*","path":".env.stag"}}'

assert_allow "Grep pattern with path=.env.local (SEC-4, not a restricted tier)" \
	'{"tool_name":"Grep","tool_input":{"pattern":"foo","path":".env.local"}}'

# Safe read-only git metadata queries stay allowed even when they name a restricted tier —
# they reveal ignore/tracking status, never file content.
assert_allow "Bash git check-ignore .env.prod (safe metadata query)" \
	'{"tool_name":"Bash","tool_input":{"command":"git check-ignore .env.prod"}}'

assert_allow "Bash git ls-files .env.stag (safe metadata query)" \
	'{"tool_name":"Bash","tool_input":{"command":"git ls-files apps/ose-www/.env.stag"}}'

assert_allow "Bash git status (safe metadata query, no tier reference)" \
	'{"tool_name":"Bash","tool_input":{"command":"git status"}}'

# SEC-2 — symlink bypass: a symlink whose own basename doesn't name a restricted tier but whose
# resolved target does must still be denied.
setup_symlink_fixture() {
	SYMLINK_TMPDIR="$(mktemp -d)"
	printf 'DUMMY=1\n' >"$SYMLINK_TMPDIR/.env.prod"
	ln -s "$SYMLINK_TMPDIR/.env.prod" "$SYMLINK_TMPDIR/notenv"
}

teardown_symlink_fixture() {
	rm -rf "$SYMLINK_TMPDIR"
}

setup_symlink_fixture
assert_deny "Read symlink resolving to .env.prod (SEC-2)" \
	"{\"tool_name\":\"Read\",\"tool_input\":{\"file_path\":\"$SYMLINK_TMPDIR/notenv\"}}"
teardown_symlink_fixture

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
