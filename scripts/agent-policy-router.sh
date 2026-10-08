#!/usr/bin/env bash
# Locate Node independently of a native host's bundled executable and limited GUI PATH.
set -euo pipefail
repo=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
node_binary=$(command -v node || true)
for candidate in "${HOME}/.volta/bin/node" "${HOME}/.local/bin/node" /opt/homebrew/bin/node /usr/local/bin/node; do
	if [[ -n $node_binary ]]; then break; fi
	if [[ -x $candidate ]]; then node_binary="$candidate"; fi
done
if [[ -z $node_binary ]]; then
	printf '%s\n' 'Repository policy requires Node on PATH, Volta, local bin or Homebrew.' >&2
	exit 1
fi
# Existing repository evaluators also need Git and jq when invoked from a GUI.
node_directory=$(dirname "$node_binary")
export PATH="${node_directory}:${HOME}/.local/bin:/opt/homebrew/bin:/usr/local/bin:${PATH:-/usr/bin:/bin}"
if [[ ${1:-} == --endpoint ]]; then
	shift
	exec "$node_binary" "$repo/scripts/agent-policy-endpoint.mjs" "$@"
fi
exec "$node_binary" "$repo/scripts/agent-policy-router.mjs" "$@"
