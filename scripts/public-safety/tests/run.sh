#!/usr/bin/env bash
# ==============================================================================
# run.sh — the public-safety wrapper's own test suite
# ==============================================================================
# Usage: bash scripts/public-safety/tests/run.sh [case-name-fragment ...]
#
# Every case is a file in cases/ that defines a `run` function. The harness
# gives each one a private temporary directory and fails the suite if any case
# fails. Cases never read the real term set's contents and never echo a term,
# so the suite's own output is safe to paste anywhere.
# ==============================================================================

set -uo pipefail

# A Git hook hands its repository's location to every child process: a hook in
# a linked worktree exports GIT_DIR, and pre-commit adds GIT_INDEX_FILE. Cases
# build fixture repositories, and under those variables every fixture command
# would reach the repository whose hook started the suite instead. Drop each
# variable Git itself names as repository-local before any case runs.
while IFS= read -r variable; do
	unset "$variable"
done < <(git rev-parse --local-env-vars 2>/dev/null)

here=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
root=$(CDPATH='' cd -- "$here/../../.." && pwd)
export PUBLIC_SAFETY_ROOT="$root"
export PREFLIGHT="$root/scripts/public-safety/outbound-preflight.sh"

pass=0
fail=0
failed_names=()

# Assertions. Each prints the claim, never the data, so a failing suite cannot
# become the disclosure the suite exists to prevent.
assert_exit() {
	local want=$1 got=$2 what=${3:-exit code}
	if [[ "$want" != "$got" ]]; then
		echo "    expected $what $want, got $got" >&2
		return 1
	fi
}

assert_contains() {
	local needle=$1 hay=$2 what=${3:-output}
	if [[ "$hay" != *"$needle"* ]]; then
		echo "    expected $what to contain: $needle" >&2
		return 1
	fi
}

assert_absent() {
	# Deliberately does not print the needle: this is the non-disclosure
	# assertion, and naming the value on failure would disclose it.
	local needle=$1 hay=$2 what=${3:-output}
	if [[ "$hay" == *"$needle"* ]]; then
		echo "    $what disclosed a value it must never contain (${#needle} chars, not shown)" >&2
		return 1
	fi
}

# A synthetic term set, so no real private identifier is written into a test
# file or into this repository's test output.
write_synthetic_terms() {
	local path=$1
	# printf rather than a tab-aligned heredoc: a formatter re-indenting heredoc
	# bodies would turn the tab separators into spaces and break the term set.
	{
		printf '%s\n' '# synthetic term set, generated per test run'
		printf '%s\t%s\t%s\n' maintainer-path literal "$SYNTHETIC_TERM"
		printf '%s\t%s\t%s\n' internal-hostname regex '\bsynthetic-host-[0-9]{4}\.invalid\b'
	} >"$path"
}

shopt -s nullglob
cases=("$here"/cases/*.sh)
shopt -u nullglob

if [[ ${#cases[@]} -eq 0 ]]; then
	echo "run.sh: no cases found under $here/cases" >&2
	exit 2
fi

for case_file in "${cases[@]}"; do
	name=$(basename "$case_file" .sh)
	if [[ $# -gt 0 ]]; then
		matched=0
		for want in "$@"; do
			[[ "$name" == *"$want"* ]] && matched=1
		done
		[[ $matched -eq 1 ]] || continue
	fi

	# Fresh state per case: a temporary directory outside the repository, and a
	# fresh synthetic term so no value survives from one case into the next.
	CASE_TMP=$(mktemp -d "${TMPDIR:-/tmp}/public-safety-test.XXXXXX")
	SYNTHETIC_TERM="zz-synthetic-private-$RANDOM$RANDOM"
	export CASE_TMP SYNTHETIC_TERM

	echo "  $name"
	if (
		set -uo pipefail
		# shellcheck source=/dev/null
		source "$case_file"
		run
	); then
		pass=$((pass + 1))
	else
		fail=$((fail + 1))
		failed_names+=("$name")
	fi
	rm -rf "$CASE_TMP"
done

echo
echo "public-safety tests: $pass passed, $fail failed"
if [[ $fail -gt 0 ]]; then
	printf 'failed: %s\n' "${failed_names[*]}" >&2
	exit 1
fi
exit 0
