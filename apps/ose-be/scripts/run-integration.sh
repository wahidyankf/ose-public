#!/usr/bin/env bash
# Integration test runner for ose-be's local filesystem and process-environment adapters.
# Network protocols, including PostgreSQL over loopback, belong to E2E.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

# Fail fast (before paying for the dotnet test build) on any xunit Skip= attribute
# left in the integration suite.
if grep -rn -E --include='*.fs' 'Skip\s*=' "${ROOT}/apps/ose-be/tests/integration"; then
	echo "ERROR: xunit Skip= attribute found in test files above" >&2
	exit 1
fi

dotnet test "${ROOT}/apps/ose-be/tests/integration/OseBe.IntegrationTests.fsproj" --logger "console;verbosity=normal"
