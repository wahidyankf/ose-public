# shellcheck shell=bash
# An empty term set is indistinguishable from "no private terms exist", which
# is the one wrong answer, so it blocks rather than passing everything.
run() {
	local terms out rc
	terms="$CASE_TMP/empty-terms.txt"
	: >"$terms"
	out=$("$PREFLIGHT" --surface commit --terms "$terms" --text "an ordinary commit message" 2>&1)
	rc=$?
	assert_exit 2 "$rc" "exit code for an empty term set" || return 1
	assert_contains "term set" "$out" "diagnostic" || return 1

	# A file of only comments and blank lines carries no terms either.
	printf '# just a comment\n\n   \n' >"$terms"
	out=$("$PREFLIGHT" --surface commit --terms "$terms" --text "an ordinary commit message" 2>&1)
	rc=$?
	assert_exit 2 "$rc" "exit code for a comments-only term set" || return 1
}
