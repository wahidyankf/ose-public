# shellcheck shell=bash
# A NUL-delimited file list is as much an input as `--file`: every entry is
# screened, a finding names the entry exactly as listed, and a list that cannot
# be trusted is a scan error rather than a smaller scan.
run() {
	local terms out rc repo
	terms="$CASE_TMP/terms.txt"
	write_synthetic_terms "$terms"

	repo="$CASE_TMP/repo"
	mkdir -p "$repo/docs/odd dir"
	printf 'ordinary text\n' >"$repo/docs/clean.md"
	printf 'first line\nnotes about %s\n' "$SYNTHETIC_TERM" >"$repo/docs/odd dir/a:b notes.md"

	# A name with a space and a colon is data, not a field separator.
	printf '%s\0' "docs/clean.md" "docs/odd dir/a:b notes.md" >"$CASE_TMP/inputs.list"
	out=$(cd "$repo" && "$PREFLIGHT" --surface baseline --terms "$terms" --file-list "$CASE_TMP/inputs.list" 2>&1)
	rc=$?
	assert_exit 1 "$rc" "exit code for a listed input carrying a term" || return 1
	assert_contains " docs/odd dir/a:b notes.md:2" "$out" "finding" || return 1
	assert_absent " docs/clean.md:" "$out" "finding" || return 1
	assert_absent "$SYNTHETIC_TERM" "$out" "finding" || return 1

	# Clean entries only: a clean pass, not a vacuous one.
	printf '%s\0' "docs/clean.md" >"$CASE_TMP/clean.list"
	out=$(cd "$repo" && "$PREFLIGHT" --surface baseline --terms "$terms" --file-list "$CASE_TMP/clean.list" 2>&1)
	rc=$?
	assert_exit 0 "$rc" "exit code for a clean list" || return 1

	# An entry that cannot be read is a scan error.
	printf '%s\0' "docs/clean.md" "docs/missing.md" >"$CASE_TMP/missing.list"
	out=$(cd "$repo" && "$PREFLIGHT" --surface baseline --terms "$terms" --file-list "$CASE_TMP/missing.list" 2>&1)
	rc=$?
	assert_exit 2 "$rc" "exit code for an unreadable listed input" || return 1

	# An empty list gives no outbound input, which is a scan error, not a pass.
	: >"$CASE_TMP/empty.list"
	out=$(cd "$repo" && "$PREFLIGHT" --surface baseline --terms "$terms" --file-list "$CASE_TMP/empty.list" 2>&1)
	rc=$?
	assert_exit 2 "$rc" "exit code for an empty list" || return 1

	# A names list is screened as text, one name per line.
	printf '%s\0' "docs/clean.md" "notes-$SYNTHETIC_TERM/readme.md" >"$CASE_TMP/names.list"
	out=$(cd "$repo" && "$PREFLIGHT" --surface baseline --terms "$terms" --names-list "$CASE_TMP/names.list" 2>&1)
	rc=$?
	assert_exit 1 "$rc" "exit code for a listed name carrying a term" || return 1
	assert_contains "<baseline-names-1>:2" "$out" "name finding" || return 1
	assert_absent "$SYNTHETIC_TERM" "$out" "name finding" || return 1
}
