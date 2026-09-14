# shellcheck shell=bash
# The disclosure test. A blocked run must not reproduce what blocked it —
# not the credential, not the private term, not raw scanner JSON.
run() {
	local terms out rc canary
	terms="$CASE_TMP/terms.txt"
	write_synthetic_terms "$terms"

	# A real key generated at runtime, so the value exists in no committed file
	# and the credential detector actually fires. A random token-shaped string
	# would not: the token detectors validate a checksum.
	openssl genrsa -out "$CASE_TMP/canary.pem" 2048 2>/dev/null || {
		echo "    cannot generate a canary key" >&2
		return 1
	}
	canary=$(sed -n '3p' "$CASE_TMP/canary.pem")

	{
		printf 'deploy notes\n'
		cat "$CASE_TMP/canary.pem"
		printf 'host %s is the target\n' "$SYNTHETIC_TERM"
	} >"$CASE_TMP/notes.txt"

	out=$("$PREFLIGHT" --surface release --terms "$terms" --file "$CASE_TMP/notes.txt" 2>&1)
	rc=$?
	assert_exit 1 "$rc" "exit code for content carrying a credential and a private term" || return 1

	assert_absent "$canary" "$out" "diagnostic" || return 1
	assert_absent "$SYNTHETIC_TERM" "$out" "diagnostic" || return 1
	assert_absent '"Raw"' "$out" "diagnostic" || return 1
	assert_absent '"RawV2"' "$out" "diagnostic" || return 1
	assert_absent "SourceMetadata" "$out" "diagnostic" || return 1

	# It must still say enough to act on.
	assert_contains "blocked" "$out" "diagnostic" || return 1

	# And it must leave nothing behind on disk. Only the directories the
	# preflight itself creates are searched: sweeping all of TMPDIR would take
	# minutes and would mostly be reading other programs' files.
	local leftovers strays
	leftovers=$(find "${TMPDIR:-/tmp}" -maxdepth 1 \
		\( -name 'public-safety.*' -o -name 'public-safety-canary.*' \) 2>/dev/null)
	if [[ -n "$leftovers" ]]; then
		echo "    the preflight left its working directories behind" >&2
		return 1
	fi

	strays=$(printf '%s\n' "$leftovers" | while IFS= read -r d; do
		[[ -n "$d" ]] && grep -rlF "$canary" "$d" 2>/dev/null
	done | head -1)
	if [[ -n "$strays" ]]; then
		echo "    the canary survived in a preflight working directory" >&2
		return 1
	fi
}
