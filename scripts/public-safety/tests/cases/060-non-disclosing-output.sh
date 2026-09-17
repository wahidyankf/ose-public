# shellcheck shell=bash
# The disclosure test. A blocked run must not reproduce what blocked it —
# not the credential, not the private term, not raw scanner JSON.
run() {
	local terms out rc canary scoped_tmp real_openssl leftovers strays
	terms="$CASE_TMP/terms.txt"
	scoped_tmp="$CASE_TMP/preflight-tmp"
	mkdir -p "$scoped_tmp"
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

	out=$(TMPDIR="$scoped_tmp" "$PREFLIGHT" --surface release --terms "$terms" --file "$CASE_TMP/notes.txt" 2>&1)
	rc=$?
	assert_exit 1 "$rc" "exit code for content carrying a credential and a private term" || return 1

	assert_absent "$canary" "$out" "diagnostic" || return 1
	assert_absent "$SYNTHETIC_TERM" "$out" "diagnostic" || return 1
	assert_absent '"Raw"' "$out" "diagnostic" || return 1
	assert_absent '"RawV2"' "$out" "diagnostic" || return 1
	assert_absent "SourceMetadata" "$out" "diagnostic" || return 1

	# It must still say enough to act on.
	assert_contains "blocked" "$out" "diagnostic" || return 1

	# A handled signal must remove the generated key as well as the ordinary
	# workspace. The OpenSSL shim creates a real key, then signals the preflight
	# while the canary path is live so this assertion cannot pass by timing.
	real_openssl=$(command -v openssl)
	mkdir -p "$CASE_TMP/bin"
	cat >"$CASE_TMP/bin/openssl" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
"$REAL_OPENSSL" "$@"
kill -TERM "$PPID"
exit 143
SH
	chmod +x "$CASE_TMP/bin/openssl"
	REAL_OPENSSL="$real_openssl" PATH="$CASE_TMP/bin:$PATH" TMPDIR="$scoped_tmp" \
		"$PREFLIGHT" --surface release --terms "$terms" --file "$CASE_TMP/notes.txt" >/dev/null 2>&1
	rc=$?
	if [[ "$rc" -eq 0 ]]; then
		echo "    the interrupted preflight unexpectedly passed" >&2
		return 1
	fi

	# Search only the private TMPDIR this case supplied. Another process cannot
	# create a false failure, and every directory found belongs to this run.
	leftovers=$(find "$scoped_tmp" -mindepth 1 -maxdepth 1 \
		\( -name 'public-safety.*' -o -name 'public-safety-canary.*' \) 2>/dev/null)
	strays=$(printf '%s\n' "$leftovers" | while IFS= read -r d; do
		[[ -n "$d" ]] && grep -rlF "$canary" "$d" 2>/dev/null
	done | head -1)
	if [[ -n "$strays" ]]; then
		echo "    the canary survived in a preflight working directory" >&2
		return 1
	fi
	if [[ -n "$leftovers" ]]; then
		echo "    the preflight left its working directories behind" >&2
		return 1
	fi
}
