#!/bin/sh
set -eu

root=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
cd "$root"

mkdir -p dist
go build -trimpath \
	-ldflags "-X github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/bootstrap.version=v0.0.0-test -X github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/bootstrap.commit=0000000000000000000000000000000000000000 -X github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/bootstrap.catalog=testcatalog" \
	-o dist/ayokoding-cli ./cmd/ayokoding-cli
AYOKODING_BIN="$root/dist/ayokoding-cli" AYOKODING_BDD_ADAPTER=e2e go test -count=1 ./tests/bdd
