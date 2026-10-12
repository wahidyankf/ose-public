# shellcheck shell=bash
# A credential finding must name the input it was found in, exactly as the
# caller gave it. The scanner reads a staged copy under the preflight's
# temporary directory, and that copy's path is machine-specific and names
# nothing a reader can act on.
run() {
	local terms out rc repo
	terms="$CASE_TMP/terms.txt"
	write_synthetic_terms "$terms"

	# An independently fabricated, unissued detector fixture; never a key.
	write_inert_credential "$CASE_TMP/inert.txt"

	repo="$CASE_TMP/repo"
	mkdir -p "$repo/docs" "$CASE_TMP/tmp"
	printf 'ordinary text\n' >"$repo/docs/clean.md"
	{
		printf 'rotation notes\n'
		cat "$CASE_TMP/inert.txt"
	} >"$repo/docs/rotation.md"

	# The credential sits in the second input, so a finding that named the
	# first one, or the staged copy's index, would be caught. A `TMPDIR` ending
	# in `/` is what macOS sets: the working directory then holds `//`, which
	# the scanner normalises away before it reports a path.
	out=$(cd "$repo" && TMPDIR="$CASE_TMP/tmp/" "$PREFLIGHT" --surface diff --terms "$terms" \
		--file docs/clean.md --file docs/rotation.md 2>&1)
	rc=$?
	assert_exit 1 "$rc" "exit code for a credential in the second input" || return 1

	assert_contains " docs/rotation.md:" "$out" "credential finding" || return 1
	assert_absent " docs/clean.md:" "$out" "credential finding" || return 1
	assert_absent "input-" "$out" "credential finding" || return 1
	assert_absent "$CASE_TMP" "$out" "credential finding" || return 1
}
