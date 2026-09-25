#!/usr/bin/env bash
# Tests for remind-rules-propagation.sh. The guard is warn-only, so every case asserts exit 0;
# what varies is whether the reminder is emitted. Both directions are checked — a guard verified
# only on the firing case would pass while firing on everything.
#
# REGRESSION (this suite once passed against a dead guard): a firing case must emit valid JSON
# carrying hookSpecificOutput.additionalContext. PreToolUse discards plain-text stdout to the debug
# log, so a guard printing prose is silently inert while still looking "non-empty" to a test that
# only checks for output. The firing assertion therefore checks the payload shape, not its length.
# It also asserts no permissionDecision is present, since emitting one would let a warn-only
# reminder auto-approve or block a call it has no business deciding.
set -uo pipefail

HOOK="$(dirname "$0")/remind-rules-propagation.sh"
pass=0
fail=0

run() { printf '%s' "$1" | "$HOOK" 2>/dev/null; }

expect() {
	local label="$1" payload="$2" want="$3" out code
	out="$(run "$payload")"
	code=$?
	if [ "$code" -ne 0 ]; then
		echo "FAIL: $label — exited $code, guard must never block"
		fail=$((fail + 1))
		return
	fi
	if [ "$want" = "fires" ]; then
		if [ -z "$out" ]; then
			echo "FAIL: $label — expected reminder, got none"
			fail=$((fail + 1))
			return
		fi
		if ! printf '%s' "$out" | jq -e '
			.hookSpecificOutput.hookEventName == "PreToolUse"
			and (.hookSpecificOutput.additionalContext | type == "string" and length > 50)
			and (.hookSpecificOutput | has("permissionDecision") | not)
		' >/dev/null 2>&1; then
			echo "FAIL: $label — output is not a model-visible additionalContext payload"
			fail=$((fail + 1))
			return
		fi
	fi
	if [ "$want" = "silent" ] && [ -n "$out" ]; then
		echo "FAIL: $label — expected silence, got reminder"
		fail=$((fail + 1))
		return
	fi
	pass=$((pass + 1))
}

# Fires: each in-scope family from the repo-rules scope table.
expect "governance prose" '{"tool_name":"Edit","tool_input":{"file_path":"repo-governance/glossary.md"}}' fires
expect "instruction surface" '{"tool_name":"Write","tool_input":{"file_path":"AGENTS.md"}}' fires
expect "binding shim" '{"tool_name":"Edit","tool_input":{"file_path":"CLAUDE.md"}}' fires
expect "agent definition" '{"tool_name":"Edit","tool_input":{"file_path":".agents/agents/rules-maker.md"}}' fires
expect "skill definition" '{"tool_name":"Write","tool_input":{"file_path":".claude/skills/x/SKILL.md"}}' fires
expect "declarations" '{"tool_name":"Edit","tool_input":{"file_path":"repo-config.yml"}}' fires
expect "enforcement wiring" '{"tool_name":"Edit","tool_input":{"file_path":".husky/pre-push"}}' fires
expect "ci workflow" '{"tool_name":"Edit","tool_input":{"file_path":".github/workflows/pr-quality-gate.yml"}}' fires
expect "style guide" '{"tool_name":"Edit","tool_input":{"file_path":"docs/explanation/software-engineering/x.md"}}' fires
expect "generated mirror" '{"tool_name":"Edit","tool_input":{"file_path":".opencode/agents/x.md"}}' fires

# Silent: out-of-scope paths, read-shaped tools, and malformed input.
expect "application source" '{"tool_name":"Edit","tool_input":{"file_path":"apps/ose-www/src/main.ts"}}' silent
expect "product spec" '{"tool_name":"Edit","tool_input":{"file_path":"specs/apps/rhino/x.feature"}}' silent
expect "plan document" '{"tool_name":"Write","tool_input":{"file_path":"plans/backlog/x/README.md"}}' silent
expect "ordinary docs" '{"tool_name":"Edit","tool_input":{"file_path":"docs/how-to/add-new-app.md"}}' silent
expect "read is not rule work" '{"tool_name":"Read","tool_input":{"file_path":"AGENTS.md"}}' silent
expect "bash is not matched" '{"tool_name":"Bash","tool_input":{"command":"cat AGENTS.md"}}' silent
expect "missing file_path" '{"tool_name":"Edit","tool_input":{}}' silent
expect "empty payload" '{}' silent

# Bash branch: the path most edits actually take. A write-shaped verb plus a guarded path fires;
# read-only inspection of the same path does not.
expect "bash heredoc redirect" '{"tool_name":"Bash","tool_input":{"command":"cat > repo-governance/x.md <<EOF"}}' fires
expect "bash sed -i" '{"tool_name":"Bash","tool_input":{"command":"sed -i .bak s/a/b/ AGENTS.md"}}' fires
expect "bash tee" '{"tool_name":"Bash","tool_input":{"command":"echo x | tee .claude/agents/a/b.md"}}' fires
expect "bash rm of a rule surface" '{"tool_name":"Bash","tool_input":{"command":"rm repo-config.yml"}}' fires
expect "bash mv into agents" '{"tool_name":"Bash","tool_input":{"command":"mv /tmp/x .claude/skills/y/SKILL.md"}}' fires
expect "bash read is silent" '{"tool_name":"Bash","tool_input":{"command":"cat AGENTS.md"}}' silent
expect "bash grep is silent" '{"tool_name":"Bash","tool_input":{"command":"grep -n rule repo-governance/glossary.md"}}' silent
expect "bash write outside scope" '{"tool_name":"Bash","tool_input":{"command":"echo x > apps/ose-www/src/main.ts"}}' silent
expect "bash no command" '{"tool_name":"Bash","tool_input":{}}' silent

# REGRESSION: stderr plumbing is not a write verb. `2>/dev/null` contains a `>`, so a naive
# write-verb probe fires on virtually every read-only command and the reminder decays into noise.
expect "stderr redirect on a read is silent" '{"tool_name":"Bash","tool_input":{"command":"grep -rn foo repo-governance/ 2>/dev/null | head -30"}}' silent
expect "2>&1 on a read is silent" '{"tool_name":"Bash","tool_input":{"command":"cat AGENTS.md 2>&1"}}' silent
expect "echo to stderr then read is silent" '{"tool_name":"Bash","tool_input":{"command":"echo hi >&2; grep x repo-governance/y.md"}}' silent
expect "real write still fires through stderr plumbing" '{"tool_name":"Bash","tool_input":{"command":"sed -i .bak s/a/b/ AGENTS.md 2>/dev/null"}}' fires
expect "redirect to a non-rule path is silent" '{"tool_name":"Bash","tool_input":{"command":"npx nx show projects --affected 2>/dev/null > /tmp/out.txt"}}' silent
expect "arrow literal in echoed prose is silent" '{"tool_name":"Bash","tool_input":{"command":"echo \"  repo-governance/x.md -> 412 words\""}}' silent
expect "fat arrow in echoed prose is silent" '{"tool_name":"Bash","tool_input":{"command":"echo \"AGENTS.md => trimmed\"; cat AGENTS.md"}}' silent

echo "passed=$pass failed=$fail"
[ "$fail" -eq 0 ]
