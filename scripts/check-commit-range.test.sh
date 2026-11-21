#!/usr/bin/env bash
# Tests for check-commit-range.sh against a throwaway history. A range of conforming commits must pass. A range whose
# bad commit comes after a conforming one must fail: the pull-request message blob shows only its first header, so this
# per-commit lint is the only check that reads a later commit. An empty range must pass, and an unknown base must fail
# closed rather than pass an empty range.
#
# The script runs from the repository root, where commitlint.config.js and node_modules live. GIT_DIR points git at the
# scratch history only for the script's own calls. The scratch commits are made from inside the scratch directory.
set -euo pipefail

# Keep the caller's Git environment from redirecting the scratch commands to another repository.
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE

here=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
root=$(CDPATH='' cd -- "$here/.." && pwd)
script="$here/check-commit-range.sh"
pass=0
fail=0

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
repo="$tmp/history"
git init -q "$repo"

# commit MESSAGE: makes an empty commit in the scratch history and prints its id. Identity comes from the environment,
# so no Git configuration is written for these throwaway commits.
commit() {
	GIT_AUTHOR_NAME=range-test GIT_AUTHOR_EMAIL=range-test@example.invalid \
		GIT_COMMITTER_NAME=range-test GIT_COMMITTER_EMAIL=range-test@example.invalid \
		git -C "$repo" commit -q --allow-empty -m "$1"
	git -C "$repo" rev-parse HEAD
}

# lint BASE HEAD: runs the script over the range and sets out and code.
lint() {
	out=$(cd "$root" && GIT_DIR="$repo/.git" COMMIT_RANGE_BASE="$1" COMMIT_RANGE_HEAD="$2" bash "$script" 2>&1) && code=0 || code=$?
}

# expect LABEL WANT BASE HEAD: WANT is "passes" (exit 0) or "fails" (non-zero exit).
expect() {
	local label="$1" want="$2" out code
	lint "$3" "$4"
	if [ "$want" = "passes" ] && [ "$code" -ne 0 ]; then
		echo "FAIL: $label: expected exit 0, got $code: $out"
		fail=$((fail + 1))
	elif [ "$want" = "fails" ] && [ "$code" -eq 0 ]; then
		echo "FAIL: $label: expected a non-zero exit, got 0"
		fail=$((fail + 1))
	else
		pass=$((pass + 1))
	fi
}

start=$(commit "chore: start the scratch history")
expect "a range of conforming commits passes" passes "$start" "$(commit "feat(gates): add the first range commit")"
conforming_head=$(commit "fix(hooks): correct the second range commit")
expect "a range of conforming commits passes through the second commit" passes "$start" "$conforming_head"

# The bad commit is the second of the range, so only a per-commit lint can see it.
bad_head=$(commit "bad message with no type")
lint "$conforming_head" "$bad_head"
if [ "$code" -ne 0 ] && [[ "$out" == *"$bad_head"* ]]; then
	pass=$((pass + 1))
else
	echo "FAIL: a non-conforming commit after a conforming one must fail and name its commit, got exit $code: $out"
	fail=$((fail + 1))
fi

expect "an empty range passes" passes "$bad_head" "$bad_head"
expect "an unknown base fails closed" fails "0000000000000000000000000000000000000000" "$bad_head"

echo "passed=$pass failed=$fail"
[ "$fail" -eq 0 ]
