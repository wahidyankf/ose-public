#!/bin/sh
# Unit gate for ayokoding-web (test-and-gate contract C15). One profile covers
# the whole production tree (internal/... and cmd/...), measured by the unit
# tests plus the BDD unit bindings (tests/bdd, adapter=unit). Integration and
# e2e suites never feed this profile. The 99% floor is enforced here, and an
# empty or unreadable report fails the gate instead of passing it.
set -eu

root=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
cd "$root"

minimum=${COVERAGE_MINIMUM:-99}
profile=coverage/unit.out

mkdir -p coverage
rm -f "$profile"
AYOKODING_BDD_ADAPTER=unit go test -race -count=1 \
	-coverpkg=./internal/...,./cmd/... \
	-coverprofile="$profile" \
	./internal/... ./cmd/... ./tests/bdd

if [ ! -s "$profile" ] || [ "$(wc -l <"$profile")" -lt 2 ]; then
	echo "unit coverage report ${profile} is empty; the gate measured nothing" >&2
	exit 1
fi

total=$(go tool cover -func="$profile" | awk '/^total:/ {print $3}')
if [ -z "$total" ]; then
	echo "unit coverage report ${profile} has no total line" >&2
	exit 1
fi

echo "unit coverage total ${total} (minimum ${minimum}%)"
percent=${total%\%}
int=${percent%.*}
if [ "$int" -lt "$minimum" ]; then
	echo "unit coverage ${total} is below COVERAGE_MINIMUM=${minimum}" >&2
	exit 1
fi
