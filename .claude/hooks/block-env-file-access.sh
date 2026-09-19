#!/usr/bin/env bash
# PreToolUse guard: named-file rule — refuse Read/Write/Edit/MultiEdit and direct Bash
# manipulation of exactly .env.prod / .env.stag (the two restricted-secrets tiers). Every
# other real .env* file (.env, .env.local, .env.test, .env.example, ...) is agent-readable.
# Commit policy is unaffected and stays deny-all for every .env* file — see
# the repository's declared `env-validate` gate (guard-env-file-access).
set -euo pipefail

# The two restricted tiers, shared by both branches below — adding a tier is a one-line change.
RESTRICTED_TIERS='prod|stag'

# Case-insensitive matching throughout (grep -i / -qi): on a case-insensitive filesystem (e.g.
# APFS in its default mode) the OS resolves `.ENV.PROD` to the same inode as `.env.prod`, so
# tier matching must not depend on case — see guard-env-file-access SEC-3.

# Resolves `$1` to its canonical, symlink-free absolute path if the path exists, echoing the
# original string unchanged if it doesn't (e.g. a Write creating a brand-new file) or if no path
# resolver is available. A restricted tier file accessed only via a symlink (`ln -s .env.prod
# /tmp/x`) must be caught by resolving the real target before the basename check — see
# guard-env-file-access SEC-2.
resolve_path() {
	if command -v realpath >/dev/null 2>&1; then
		realpath -q -- "$1" 2>/dev/null || printf '%s' "$1"
	elif command -v readlink >/dev/null 2>&1 && readlink -f -- "$1" >/dev/null 2>&1; then
		readlink -f -- "$1" 2>/dev/null || printf '%s' "$1"
	else
		printf '%s' "$1"
	fi
}

input="$(cat)"
tool_name="$(printf '%s' "$input" | jq -r '.tool_name // empty')"

# --- File-tool branch (Read/Write/Edit/MultiEdit/Grep/Glob) ---
if [ "$tool_name" != "Bash" ]; then
	# Grep/Glob carry the target under `.tool_input.path`, not `.tool_input.file_path`.
	file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.path // empty')"
	[ -z "$file_path" ] && exit 0

	deny_file() {
		cat <<JSON
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Repo policy (guard-env-file-access): agents may not directly read, write, or edit .env.prod or .env.stag. Use a project script under apps/|libs/|scripts/, or ask the user to make the change manually."}}
JSON
		exit 0
	}

	# Literal-name check on the path as given.
	base="$(basename "$file_path")"
	if printf '%s' "$base" | grep -qiE "^\\.env\\.($RESTRICTED_TIERS)\$"; then
		deny_file
	fi

	# Resolved-path check: catches a symlink whose own basename doesn't name a restricted tier
	# but whose target does (SEC-2). Only meaningful when the path actually exists on disk.
	resolved="$(resolve_path "$file_path")"
	if [ "$resolved" != "$file_path" ]; then
		resolved_base="$(basename "$resolved")"
		if printf '%s' "$resolved_base" | grep -qiE "^\\.env\\.($RESTRICTED_TIERS)\$"; then
			deny_file
		fi
	fi

	exit 0
fi

# --- Bash branch ---
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty')"
[ -z "$cmd" ] && exit 0

deny_env() {
	cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Repo policy (guard-env-file-access): agents may not directly manipulate .env.prod or .env.stag via Bash. Invoke a project script under apps/|libs/|scripts/ instead, or ask the user to make the change manually."}}
JSON
	exit 0
}

# Default-deny (SEC-1): an enumerated-verb blocklist can never be completed — any interpreter,
# archiver, or hex viewer (python3 -c 'open(...)', rsync, awk, xxd, ...) reopens it. Instead,
# deny the command outright the moment its raw text references either restricted tier ANYWHERE
# — a bare argument, inside a quoted string, inside a variable assignment
# (`f=.env.prod; cat "$f"`), split across quotes, or as a tool argument — and allow only a
# narrow, explicitly-safe carve-out. This also closes the case-change bypass (grep -i) and the
# "$var" indirection case where the restricted-tier literal still appears verbatim in the
# command text. It does NOT close indirection that never spells the tier out literally (e.g.
# `t=prod; cat ".env.$t"`) — that residual gap is inherent to text-based matching and is
# documented in secrets-and-env-standards.md section 9; it is not fixable by a text regex in
# principle.
RESTRICTED_TIER_PATTERN="\\.env\\.($RESTRICTED_TIERS)([^a-zA-Z0-9_]|\$)"

if ! printf '%s' "$cmd" | grep -qiE "$RESTRICTED_TIER_PATTERN"; then
	# Command text never references a restricted tier — nothing to guard.
	exit 0
fi

# Narrow safe carve-out: read-only git metadata queries that reveal only ignore/tracking/status
# information, never file content, are allowed even when they name a restricted tier (e.g.
# confirming `.env.prod` is git-ignored).
if printf '%s' "$cmd" | grep -qiE "(^|[[:space:]])git[[:space:]]+(check-ignore|ls-files|status)([[:space:]]|\$)"; then
	exit 0
fi

# Everything else that references a restricted tier is denied by default — including
# apps/|libs/|scripts/-rooted invocations, since the agent's Bash tool is still the one placing
# the restricted path on the command line. A project script that legitimately needs to touch
# `.env.prod`/`.env.stag` should read the path itself rather than receive it as an
# agent-supplied argument; otherwise ask the user to make the change manually.
deny_env
