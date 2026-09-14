# shellcheck shell=bash
# A term set that is not there blocks. It never degrades to "scan what we can".
run() {
	local out rc
	out=$("$PREFLIGHT" --surface commit --terms "$CASE_TMP/does-not-exist.txt" \
		--text "an ordinary commit message" 2>&1)
	rc=$?
	assert_exit 2 "$rc" "exit code for a missing term set" || return 1
	assert_contains "term set" "$out" "diagnostic" || return 1
	assert_contains "blocked" "$out" "diagnostic" || return 1
}
