#!/bin/sh
set -eu

root=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
cd "$root"

mkdir -p coverage
go test -race -count=1 ./tests/architecture ./tests/coverage

# The whole authored production tree is measured: every package under internal,
# cmd, and toolchains, minus Windows-only files that a Linux run never compiles.
# Both unit runs (plain unit tests and BDD unit bindings) instrument the same
# packages, and their profiles merge into one report; integration and e2e
# profiles are never read here.
coverpkg=./internal/...,./cmd/...,./toolchains
production_files=$(find internal cmd toolchains -name '*.go' ! -name '*_test.go' ! -name '*_windows.go' | sort | paste -sd, -)

go test -race -count=1 -coverpkg="$coverpkg" -coverprofile=coverage/unit.out ./internal/... ./cmd/...
AYOKODING_BDD_ADAPTER=unit go test -race -count=1 -coverpkg="$coverpkg" -coverprofile=coverage/bdd.out ./tests/bdd
{
	cat coverage/unit.out
	grep -v '^mode:' coverage/bdd.out
} >coverage/unit-report.out
go run ./tests/coverage --profile coverage/unit-report.out \
	--files "$production_files" \
	--minimum "${COVERAGE_MINIMUM:-99}"
