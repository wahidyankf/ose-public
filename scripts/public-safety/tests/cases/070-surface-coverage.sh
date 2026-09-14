# shellcheck shell=bash
# Every publication surface this plan can emit through is accepted, and a
# surface outside the closed set is refused rather than silently scanned.
run() {
	local terms out rc surface
	terms="$CASE_TMP/terms.txt"
	write_synthetic_terms "$terms"

	for surface in baseline diff commit ref pull-request release logs; do
		out=$("$PREFLIGHT" --surface "$surface" --terms "$terms" --text "ordinary clean text" 2>&1)
		rc=$?
		assert_exit 0 "$rc" "exit code for surface $surface" || return 1
		assert_contains "$surface: clean" "$out" "summary for surface $surface" || return 1
	done

	# The same set still blocks. Coverage that only proves acceptance proves
	# nothing: a surface that accepts everything is not screening it.
	for surface in baseline diff commit ref pull-request release logs; do
		out=$("$PREFLIGHT" --surface "$surface" --terms "$terms" --text "about $SYNTHETIC_TERM" 2>&1)
		rc=$?
		assert_exit 1 "$rc" "blocked exit code for surface $surface" || return 1
		assert_absent "$SYNTHETIC_TERM" "$out" "diagnostic for surface $surface" || return 1
	done

	# Outside the closed set.
	out=$("$PREFLIGHT" --surface telepathy --terms "$terms" --text "ordinary clean text" 2>&1)
	rc=$?
	assert_exit 2 "$rc" "exit code for an unsupported surface" || return 1

	# And a surface with no input is a scan error, not a pass.
	out=$("$PREFLIGHT" --surface commit --terms "$terms" 2>&1)
	rc=$?
	assert_exit 2 "$rc" "exit code when no outbound input is given" || return 1
}
