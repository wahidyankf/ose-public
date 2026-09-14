# shellcheck shell=bash
# Outbound text carrying a private term is blocked, and the diagnostic reports
# the class and location without reproducing the term.
run() {
	local terms out rc
	terms="$CASE_TMP/terms.txt"
	write_synthetic_terms "$terms"

	printf 'release notes mentioning %s in passing\n' "$SYNTHETIC_TERM" >"$CASE_TMP/notes.txt"
	out=$("$PREFLIGHT" --surface release --terms "$terms" --file "$CASE_TMP/notes.txt" 2>&1)
	rc=$?
	assert_exit 1 "$rc" "exit code for matching content" || return 1
	assert_contains "maintainer-path" "$out" "diagnostic" || return 1
	assert_absent "$SYNTHETIC_TERM" "$out" "diagnostic" || return 1

	# A regex term matches the same way.
	printf 'ssh to synthetic-host-4242.invalid for the deploy\n' >"$CASE_TMP/notes.txt"
	out=$("$PREFLIGHT" --surface release --terms "$terms" --file "$CASE_TMP/notes.txt" 2>&1)
	rc=$?
	assert_exit 1 "$rc" "exit code for a regex match" || return 1
	assert_contains "internal-hostname" "$out" "diagnostic" || return 1
	assert_absent "synthetic-host-4242.invalid" "$out" "diagnostic" || return 1

	# A name is outbound content too, not only a body.
	printf 'nothing private here\n' >"$CASE_TMP/notes.txt"
	out=$("$PREFLIGHT" --surface ref --terms "$terms" --text "feature/$SYNTHETIC_TERM" 2>&1)
	rc=$?
	assert_exit 1 "$rc" "exit code for a matching ref name" || return 1
	assert_absent "$SYNTHETIC_TERM" "$out" "diagnostic" || return 1
}
