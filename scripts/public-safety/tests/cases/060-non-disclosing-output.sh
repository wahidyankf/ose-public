# shellcheck shell=bash
# A blocked run names its findings without reproducing inert credential data,
# private terms, or raw scanner JSON. Cleanup is scoped to this run's TMPDIR.
run() {
	local terms out rc canary payload scoped_tmp leftovers
	terms="$CASE_TMP/terms.txt"
	scoped_tmp="$CASE_TMP/preflight-tmp"
	mkdir -p "$scoped_tmp"
	write_synthetic_terms "$terms"
	write_inert_credential "$CASE_TMP/inert.txt"
	canary=$(<"$CASE_TMP/inert.txt")
	payload=${canary#*_}

	{
		printf 'deploy notes\n'
		cat "$CASE_TMP/inert.txt"
		printf 'host %s is the target\n' "$SYNTHETIC_TERM"
	} >"$CASE_TMP/notes.txt"

	out=$(TMPDIR="$scoped_tmp" "$PREFLIGHT" --surface release --terms "$terms" --file "$CASE_TMP/notes.txt" 2>&1)
	rc=$?
	assert_exit 1 "$rc" "exit code for content carrying an inert credential and a private term" || return 1
	assert_absent "$canary" "$out" "diagnostic" || return 1
	assert_absent "$payload" "$out" "diagnostic" || return 1
	assert_absent "$SYNTHETIC_TERM" "$out" "diagnostic" || return 1
	assert_absent '"Raw"' "$out" "diagnostic" || return 1
	assert_absent '"RawV2"' "$out" "diagnostic" || return 1
	assert_absent 'SourceMetadata' "$out" "diagnostic" || return 1
	assert_contains 'blocked' "$out" "diagnostic" || return 1

	# Signal cleanup and scanner retirement are exercised by case 180 after
	# that scanner acknowledges the actual inert canary file.
	leftovers=$(find "$scoped_tmp" -mindepth 1 -maxdepth 1)
	if [[ -n "$leftovers" ]]; then
		echo '    the preflight left its working directories behind' >&2
		return 1
	fi
}
