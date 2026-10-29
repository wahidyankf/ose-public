#!/bin/sh
# Unit gate for ayokoding-web: skip-guard lives in project.json, the 99%
# statement floor is enforced here. Production denominators are internal/...
# only: cmd/ holds the process entrypoint, tests/ holds support and glue.
set -eu

root=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
cd "$root"

mkdir -p coverage
go test -race -count=1 \
	-coverpkg=./internal/... \
	-coverprofile=coverage/unit.out \
	./internal/... ./cmd/...
total=$(go tool cover -func=coverage/unit.out | awk '/^total:/ {print $3}')
minimum=${COVERAGE_MINIMUM:-99}
echo "unit coverage total ${total} (minimum ${minimum}%)"
percent=${total%\%}
int=${percent%.*}
if [ "$int" -lt "$minimum" ]; then
	echo "unit coverage ${total} is below COVERAGE_MINIMUM=${minimum}" >&2
	exit 1
fi
AYOKODING_BDD_ADAPTER=unit go test -race -count=1 ./tests/bdd
