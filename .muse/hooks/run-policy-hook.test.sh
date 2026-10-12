#!/usr/bin/env bash
# Verify the Muse policy adapter: allow stays silent with exit 0, every deny
# and every failure becomes stderr plus exit 2, because Muse honors exit
# statuses and ignores Claude-style stdout JSON decisions.
set -euo pipefail
repo=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)
wrapper="$repo/.muse/hooks/run-policy-hook.sh"
work=$(mktemp -d "${TMPDIR:-/tmp}/muse-adapter-XXXXXX")
trap 'rm -rf "$work"' EXIT
fail=0
check() {
	desc=$1
	want=$2
	shift 2
	got=0
	out=$("$@" 2>"$work/stderr.txt") || got=$?
	if [[ $got != "$want" ]]; then
		printf 'FAIL: %s (want exit %s, got %s)\n' "$desc" "$want" "$got" >&2
		fail=1
		return
	fi
	if [[ $want == 0 && -n $out ]]; then
		printf 'FAIL: %s (allow must stay silent)\n' "$desc" >&2
		fail=1
	elif [[ $want != 0 && ! -s "$work/stderr.txt" ]]; then
		printf 'FAIL: %s (deny must explain on stderr)\n' "$desc" >&2
		fail=1
	fi
}
payload() {
	printf '{"hook_event_name":"PreToolUse","tool_name":"%s","tool_input":%s,"cwd":"%s","session_id":"test"}' \
		"$1" "$2" "$repo"
}
check 'rejects wrong args' 2 bash "$wrapper" bogus </dev/null
check 'fails closed on empty stdin' 2 bash "$wrapper" agent-policy </dev/null
check 'fails closed on garbage stdin' 2 bash "$wrapper" agent-policy <<<"not json"
check 'allows a plain repo read' 0 bash "$wrapper" agent-policy \
	<<<"$(payload read_file '{"path":"AGENTS.md"}')"
check 'denies a Muse write to .env.prod' 2 bash "$wrapper" agent-policy \
	<<<"$(payload write_file '{"content":"x","path":".env.prod"}')"
check 'denies a Muse shell reference to .env.prod' 2 bash "$wrapper" agent-policy \
	<<<"$(payload bash '{"command":"cat .env.prod"}')"
if [[ $fail != 0 ]]; then exit 1; fi
printf 'muse policy adapter: all cases pass\n'
