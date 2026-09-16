#!/usr/bin/env bash
# Tests for require-hippo-boundary.sh. The guard always exits 0; what varies is whether a `deny`
# payload is emitted. Both directions are asserted — a guard verified only on its denying cases
# would pass while denying everything, which in a PreToolUse hook means the session cannot run any
# command at all.
#
# The firing assertion checks the payload SHAPE, not merely that output exists. PreToolUse discards
# plain-text stdout to the debug log, so a guard printing prose is silently inert while still
# looking "non-empty" to a length check — the exact way a hook can pass its own suite and still let
# the host run out of memory.
set -uo pipefail

HOOK="$(dirname "$0")/require-hippo-boundary.sh"
pass=0
fail=0

bash_payload() { jq -nc --arg c "$1" '{tool_name:"Bash",tool_input:{command:$c}}'; }

expect() {
	local label="$1" payload="$2" want="$3" out code
	out="$(printf '%s' "$payload" | "$HOOK" 2>/dev/null)"
	code=$?
	if [ "$code" -ne 0 ]; then
		echo "FAIL: $label — exited $code, guard must always exit 0"
		fail=$((fail + 1))
		return
	fi
	if [ "$want" = "denies" ]; then
		if ! printf '%s' "$out" | jq -e '
			.hookSpecificOutput.hookEventName == "PreToolUse"
			and .hookSpecificOutput.permissionDecision == "deny"
			and (.hookSpecificOutput.permissionDecisionReason | type == "string" and length > 80)
		' >/dev/null 2>&1; then
			echo "FAIL: $label — expected a deny payload, got: ${out:-<empty>}"
			fail=$((fail + 1))
			return
		fi
	fi
	if [ "$want" = "allows" ] && [ -n "$out" ]; then
		echo "FAIL: $label — expected silence, got: $out"
		fail=$((fail + 1))
		return
	fi
	pass=$((pass + 1))
}

cmd_denies() { expect "$1" "$(bash_payload "$2")" denies; }
cmd_allows() { expect "$1" "$(bash_payload "$2")" allows; }

# --- Non-Bash and malformed input: never decide -----------------------------------------------
expect "Edit tool is not matched" '{"tool_name":"Edit","tool_input":{"file_path":"AGENTS.md"}}' allows
expect "Read tool is not matched" '{"tool_name":"Read","tool_input":{"file_path":"package.json"}}' allows
expect "missing command" '{"tool_name":"Bash","tool_input":{}}' allows
expect "empty payload" '{}' allows
cmd_allows "empty command string" ""

# --- The boundary itself, in each form it legitimately appears in ------------------------------
cmd_allows "canonical guarded form" "rtk ./hippo run --class ephemeral --disk-path . -- npm install"
cmd_allows "guarded without rtk" "./hippo run --class transactional --disk-path . -- npm exec nx -- run app:build"
cmd_allows "guarded after a cd" "cd apps/ose-id-be && ../../hippo run --class ephemeral --disk-path . -- dotnet build"
cmd_allows "guarded fan-out" "rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- affected -t build"
cmd_allows "hippo on PATH" "hippo run --class ephemeral --disk-path . -- cargo test"
cmd_allows "hippo status is not compute" "rtk ./hippo status"

# --- The carve-out that must NOT be wrapped ----------------------------------------------------
# Every compute-bearing package.json script already carries its own boundary. Denying these would
# push the model into double-guarding, where the inner call waits on its own ancestor's lease.
cmd_allows "npm run script" "rtk npm run build"
cmd_allows "npm run with args" "rtk npm run test -- --watch=false"
cmd_allows "npm test alias" "rtk npm test"

# --- Ordinary non-compute commands -------------------------------------------------------------
cmd_allows "git status" "rtk git status"
cmd_allows "reading a file" "rtk cat package.json"
cmd_allows "listing" "rtk ls apps/"

# --- Trivial metadata invocations ---------------------------------------------------------------
cmd_allows "tool version" "rtk dotnet --version"
cmd_allows "npx tool version" "rtk npx playwright --version"
cmd_allows "cargo version" "cargo --version"
cmd_allows "npm help" "npm --help"
cmd_allows "tool subcommand help" "rtk nx run --help"
cmd_allows "dotnet metadata verb" "rtk dotnet --list-sdks"
cmd_allows "cargo metadata is not compute" "rtk cargo metadata --format-version 1"
cmd_allows "mix help is not compute" "rtk mix --help"

# --- npm exec / install / ci ---------------------------------------------------------------------
cmd_denies "unguarded npm install" "rtk npm install"
cmd_denies "unguarded npm ci" "npm ci"
cmd_denies "unguarded npm exec" "rtk npm exec nx -- run ose-id-be:test:quick"
cmd_denies "the exact fan-out that exhausted the host" "rtk npm exec nx -- run-many -t typecheck,lint,test:quick -p ose-id-be,ose-id-web"

# --- npx -------------------------------------------------------------------------------------------
cmd_denies "unguarded npx" "rtk npx nx run ose-id-web:build"
cmd_denies "unguarded npx playwright" "npx playwright test"

# --- bare nx through a PATH shim -------------------------------------------------------------------
cmd_denies "bare nx run" "rtk nx run ose-id-web:build"
cmd_denies "bare nx affected" "nx affected -t test:quick"
cmd_allows "nx substring is not nx" "rtk ls linux-nxdomain"

# --- dotnet ----------------------------------------------------------------------------------------
cmd_denies "unguarded dotnet build" "rtk dotnet build apps/ose-id-be/src/OseId.Host/OseId.Host.csproj"
cmd_denies "unguarded dotnet test" "dotnet test"
cmd_denies "unguarded dotnet publish" "rtk dotnet publish -c Release"
cmd_denies "unguarded dotnet format" "rtk dotnet format --verify-no-changes"

# --- cargo -----------------------------------------------------------------------------------------
cmd_denies "unguarded cargo test" "rtk cargo test --workspace"
cmd_denies "unguarded cargo xtask" "cargo xtask ci"
cmd_denies "unguarded cargo clippy" "rtk cargo clippy --all-targets"

# --- mix -------------------------------------------------------------------------------------------
cmd_denies "unguarded mix deps.get" "rtk mix deps.get"
cmd_denies "unguarded mix test" "mix test"
cmd_denies "unguarded mix phx.server" "rtk mix phx.server"

# --- Command position: a verb is only a verb when the shell would execute it ------------------------
# REGRESSION, observed live during authoring: the guard once matched these verbs anywhere in the
# line, so an ordinary search for the string was refused — including the command that was running
# this very suite. A guard that blocks everyday searching is one that gets switched off, and a
# switched-off guard protects nothing at all.
cmd_allows "grep for a guarded verb" "rtk grep -rn 'npm install' docs/"
cmd_allows "ripgrep for a guarded verb" "rg 'dotnet build' --glob '*.md'"
cmd_allows "grep piped to head" "rtk grep -rn 'npm exec' . | head -30"
cmd_allows "prose in an echo" "echo 'run npm install first'"
cmd_allows "prose in an echo with a pipe" "echo 'run npm install first' | tee /tmp/note"
cmd_allows "a filename containing a verb" "rtk cat docs/npm-install-notes.md"
cmd_allows "a flag value containing a verb" "rtk git log --grep 'cargo build' --oneline"

# The flip side: command position still catches every real invocation, including composed ones.
cmd_denies "verb after cd and &&" "cd apps/ose-id-web && npm install"
cmd_denies "verb after a semicolon" "rtk git status; npm ci"
cmd_denies "verb as the second stage of a pipe" "rtk echo hi | npm exec nx -- run app:build"
cmd_denies "verb behind an env assignment" "CI=1 npm install"
cmd_denies "verb behind rtk and an env assignment" "rtk NODE_ENV=test npm exec nx -- run app:test"
cmd_denies "PATH-qualified invocation" "/usr/local/bin/npm install"
cmd_denies "verb inside a subshell" "(cd apps/x && dotnet build)"
cmd_denies "verb inside a command substitution" "echo \$(npm exec nx -- show projects)"

# --- REGRESSION: the trailing-flag hole --------------------------------------------------------------
# An earlier draft allowed any command ending in a help-shaped token, so a real build ending in one
# was waved through. The carve-out is now positional: only the token right after the tool, or right
# after its subcommand, qualifies.
cmd_denies "build with a trailing help-shaped arg" "rtk npm exec nx -- run app:build --help"
cmd_denies "dotnet test with trailing -v" "rtk dotnet test -v"
cmd_denies "subcommand help flag that is not last" "rtk nx run app:build --help extra"
cmd_allows "verb plus a bare help flag prints help only" "cargo test -h"
cmd_denies "verb plus an argument and a help flag" "cargo test --workspace -h"

# --- REGRESSION: the verb's trailing boundary ---------------------------------------------------------
# Once `([[:space:]]|$)`, so any non-space character immediately after the verb — a semicolon, a
# redirect, an ampersand — ended the match and let the command through.
cmd_denies "trailing semicolon" "rtk npm install; echo done"
cmd_denies "trailing redirect" "rtk dotnet build >/tmp/out.log"
cmd_denies "trailing ampersand backgrounding" "npx playwright test &"

# --- REGRESSION: composition must not launder an unguarded node ----------------------------------------
# A guarded segment covers the line by design, but a line with NO boundary anywhere must be denied
# however it is composed.
cmd_denies "unguarded command chained after a read" "rtk git status && npm exec nx -- run app:build"
cmd_denies "unguarded command in a semicolon chain" "cd apps/ose-id-web; npx next build"

# --- Consumer check: coverage follows the ./hippo consumer, not the filesystem --------------------------
# These run the guard from a directory that is not a HIPPO-consuming repository. The command is one
# the guard denies everywhere else, so a silent result here proves the check fired rather than that
# the pattern simply missed.
consumer_case() {
	local label="$1" dir="$2" out
	out="$(cd "$dir" && printf '%s' "$(bash_payload "rtk npm install")" | "$HOOK" 2>/dev/null)"
	if [ -n "$out" ]; then
		echo "FAIL: $label — expected silence outside a consuming repo, got a deny"
		fail=$((fail + 1))
		return
	fi
	pass=$((pass + 1))
}

scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT
consumer_case "outside any git repository" "$scratch"

git -C "$scratch" init -q 2>/dev/null
consumer_case "git repository with no ./hippo consumer" "$scratch"

# Positive control: the same command inside a repository that DOES ship ./hippo must still be
# denied. Without this, the consumer cases above would pass against a guard that never fires at all.
cmd_denies "consuming repository still denies" "rtk npm install"

echo "passed=$pass failed=$fail"
[ "$fail" -eq 0 ]
