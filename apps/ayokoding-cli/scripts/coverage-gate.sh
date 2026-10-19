#!/bin/sh
set -eu

root=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
cd "$root"

mkdir -p coverage
go test -race -count=1 ./tests/architecture ./tests/coverage
go test -race -count=1 \
	-coverpkg=./internal/domain/...,./internal/application/... \
	-coverprofile=coverage/unit.out \
	./internal/... ./cmd/...
go run ./tests/coverage --profile coverage/unit.out \
	--directories internal/domain/finding \
	--minimum "${COVERAGE_MINIMUM:-99}"
AYOKODING_BDD_ADAPTER=unit go test -race -count=1 ./tests/bdd
