#!/usr/bin/env bash
# E2E test runner for ose-be.
# Brings up PostgreSQL + NATS via docker-compose and lets the Playwright harness
# own backend process lifecycle so startup behaviours can observe real transitions.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

# Fail fast (before paying for docker-compose/dotnet startup) on any unconditional
# test.skip() left in the e2e suite. test.skip(condition, reason) - the documented
# Playwright environment-guard form - is intentionally allowed through.
if grep -rn -E --include='*.ts' --exclude-dir=node_modules --exclude-dir=.features-gen --exclude-dir=test-results --exclude-dir=playwright-report '\$?test\.skip\([^,)]*\)' "${ROOT}/apps/ose-be-e2e"; then
	echo "ERROR: unconditional test.skip() found in test files above - use test.skip(condition, reason) for legitimate environment guards, or remove" >&2
	exit 1
fi

COMPOSE_FILE="${ROOT}/apps/ose-be/docker-compose.e2e.yml"
PROJECT_NAME="ose-be-e2e"
PORT=8302
FSPROJ="${ROOT}/apps/ose-be/src/OseBe/OseBe.fsproj"

cleanup() {
	docker compose -p "${PROJECT_NAME}" -f "${COMPOSE_FILE}" down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Start infrastructure
docker compose -p "${PROJECT_NAME}" -f "${COMPOSE_FILE}" down -v >/dev/null 2>&1 || true
docker compose -p "${PROJECT_NAME}" -f "${COMPOSE_FILE}" up -d --wait

# Build the backend
dotnet build "${FSPROJ}" --configuration Release --nologo -v quiet

# Start backend in background
export DATABASE_URL="Host=localhost;Port=5435;Database=ose_app;Username=postgres;Password=${POSTGRES_PASSWORD:-postgres}"
export OSE_BE_PORT="${PORT}"
export OSE_BE_CORS_ORIGINS="*"
export OSE_BE_NATS_URL="nats://localhost:4225"
export OSE_BE_OPENROUTER_API_KEY=""
export OSE_BE_OPENROUTER_MODEL="openrouter/auto"
export OSE_BE_OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"

# Run the Playwright e2e suite. Its shared process harness starts/stops the
# backend inside scenario steps and performs final worker cleanup.
cd "${ROOT}/apps/ose-be-e2e"
npx bddgen && npx playwright test
