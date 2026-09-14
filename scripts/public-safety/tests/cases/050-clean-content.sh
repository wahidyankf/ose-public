# shellcheck shell=bash
# Clean content passes — against the synthetic set and against the real one,
# which proves the tracked term set parses without ever showing a term.
run() {
	local terms out rc
	terms="$CASE_TMP/terms.txt"
	write_synthetic_terms "$terms"

	printf 'Add a paragraph about ordinary things.\n' >"$CASE_TMP/notes.txt"
	out=$("$PREFLIGHT" --surface commit --terms "$terms" --file "$CASE_TMP/notes.txt" 2>&1)
	rc=$?
	assert_exit 0 "$rc" "exit code for clean content" || return 1

	# Default term set, clean input: the repository's own tracked terms load,
	# validate, and find nothing. No term is printed by a passing run.
	out=$("$PREFLIGHT" --surface commit --text "Add a paragraph about ordinary things." 2>&1)
	rc=$?
	assert_exit 0 "$rc" "exit code with the default term set" || return 1
	assert_contains "clean" "$out" "passing summary" || return 1
}
