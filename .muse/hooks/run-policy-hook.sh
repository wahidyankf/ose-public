#!/usr/bin/env bash
# Adapt Muse PreToolUse payloads to the repository policy endpoint. Muse honors
# exit statuses and ignores Claude-style stdout JSON decisions, so a denial
# becomes stderr plus exit 2 while an allow stays silent with exit 0.
set -euo pipefail
repo=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)
if [[ $# != 1 || $1 != agent-policy ]]; then
	printf '%s\n' 'Invalid Muse hook payload.' >&2
	exit 2
fi
payload=$(cat)
if [[ -z $payload ]]; then
	printf '%s\n' 'Empty Muse hook payload.' >&2
	exit 2
fi
output=$(printf '%s' "$payload" | /bin/bash "$repo/scripts/agent-policy-hook.sh" --harness muse) || {
	printf '%s\n' 'Repository policy endpoint failed; tool refused.' >&2
	exit 2
}
[[ -z $output ]] && exit 0
printf '%s\n' "$output" >&2
exit 2
