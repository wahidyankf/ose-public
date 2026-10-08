#!/usr/bin/env bash
# Repository-owned policy endpoint.
set -euo pipefail
repo=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
exec /bin/bash "$repo/scripts/agent-policy-router.sh" --endpoint "$@"
