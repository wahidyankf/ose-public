# shellcheck shell=bash
# Actual detection must precede clean publication. Faults must refuse without
# disclosure, and both ordinary and interrupted runs remove their workspace.
run() {
	local terms bin scoped_tmp out rc marker payload mode cache plat scanner real_jq leftovers fault_marker
	local preflight_pid scanner_pid count
	terms="$CASE_TMP/terms.txt"
	bin="$CASE_TMP/bin"
	scoped_tmp="$CASE_TMP/preflight-tmp"
	mkdir -p "$bin" "$scoped_tmp" || return 1
	write_synthetic_terms "$terms"
	write_inert_credential "$CASE_TMP/inert.txt"
	marker=$(<"$CASE_TMP/inert.txt")
	payload=${marker#*_}

	# The old implementation must be refused before it can generate a key.
	# Keep this sentinel installed for every real and faulty scanner invocation.
	cat >"$bin/openssl" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
printf 'attempt\n' >>"$OPENSSL_ATTEMPTS"
exit 99
SH
	chmod +x "$bin/openssl" || return 1
	export OPENSSL_ATTEMPTS="$CASE_TMP/openssl-attempts"
	: >"$OPENSSL_ATTEMPTS"
	out=$(PATH="$bin:$PATH" TMPDIR="$scoped_tmp" "$PREFLIGHT" --surface commit \
		--terms "$terms" --text 'ordinary clean text' 2>&1)
	rc=$?
	if [[ -s "$OPENSSL_ATTEMPTS" ]]; then
		echo '    refusing sentinel prevented key generation' >&2
	fi
	assert_exit 0 "$rc" "real scanner clean-input canary contract" || return 1
	[[ ! -s "$OPENSSL_ATTEMPTS" ]] || {
		echo '    canary invoked prohibited key generation' >&2
		return 1
	}
	out=$(PATH="$bin:$PATH" TMPDIR="$scoped_tmp" "$PREFLIGHT" --surface logs \
		--terms "$terms" --file "$CASE_TMP/inert.txt" 2>&1)
	rc=$?
	assert_exit 1 "$rc" "real scanner inert-input detection" || return 1
	assert_absent "$marker" "$out" || return 1
	assert_absent "$payload" "$out" || return 1
	leftovers=$(find "$scoped_tmp" -mindepth 1 -maxdepth 1)
	[[ -z "$leftovers" ]] || {
		echo '    real scanner left a workspace' >&2
		return 1
	}

	# Cache overrides are isolated fault fixtures, never substitutes for the
	# actual pinned scanner detection above.
	case "$(uname -s)" in Darwin) plat=darwin ;; Linux) plat=linux ;; *) return 1 ;; esac
	case "$(uname -m)" in arm64 | aarch64) plat+=_arm64 ;; x86_64 | amd64) plat+=_amd64 ;; *) return 1 ;; esac
	cache="$CASE_TMP/fault-cache"
	scanner="$cache/trufflehog/3.97.1/$plat/trufflehog"
	mkdir -p "${scanner%/*}" || return 1
	cat >"$scanner" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
case "$CANARY_FAULT" in
missing) exit 0 ;;
missing-183) exit 183 ;;
scanner-error) exit 42 ;;
malformed) printf '{broken\n'; exit 183 ;;
*)
    file=$(find "$2" -type f -name 'canary.txt' -print -quit)
    [[ -n "$file" ]] || exit 44
    if [[ "$CANARY_FAULT" == signal ]]; then
        [[ -s "$file" ]] || exit 45
        printf '%s\n' "$$" >"$SCANNER_ACK"
        # Finite helper: the parent test signals the explicitly owned leaf
        # PID while this acknowledged canary invocation is still live.
        sleep 1
        exit 143
    fi
    value=$(<"$file")
    printf '%s\n' "$value" >"$FAULT_MARKER"
    printf '{"DetectorName":"Github","Raw":"%s","SourceMetadata":{"Data":{"Filesystem":{"file":"canary.txt","line":1}}}}\n' "$value"
    exit 183
    ;;
esac
SH
	chmod +x "$scanner" || return 1
	real_jq=$(command -v jq)
	cat >"$bin/jq" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
case "$CANARY_FAULT" in
jq-error) exit 43 ;;
passthrough) cat ;;
payload-leak)
    "$REAL_JQ" -r '.Raw | sub("^[^_]*_"; "")'
    ;;
*) exec "$REAL_JQ" "$@" ;;
esac
SH
	chmod +x "$bin/jq" || return 1
	for mode in missing missing-183 scanner-error malformed jq-error passthrough payload-leak; do
		out=$(CANARY_FAULT="$mode" REAL_JQ="$real_jq" SCANNER_ACK="$CASE_TMP/scanner-ack" \
			FAULT_MARKER="$CASE_TMP/fault-marker" \
			PUBLIC_SAFETY_CACHE="$cache" PATH="$bin:$PATH" TMPDIR="$scoped_tmp" \
			"$PREFLIGHT" --surface commit --terms "$terms" --text 'ordinary clean text' 2>&1)
		rc=$?
		assert_exit 2 "$rc" "canary fault $mode" || return 1
		assert_contains 'scan-error' "$out" "canary fault $mode" || return 1
		assert_absent "$marker" "$out" || return 1
		assert_absent "$payload" "$out" || return 1
		if [[ -s "$CASE_TMP/fault-marker" ]]; then
			fault_marker=$(<"$CASE_TMP/fault-marker")
			assert_absent "$fault_marker" "$out" || return 1
			assert_absent "${fault_marker#*_}" "$out" || return 1
		fi
		leftovers=$(find "$scoped_tmp" -mindepth 1 -maxdepth 1)
		[[ -z "$leftovers" ]] || {
			echo '    fault left a workspace' >&2
			return 1
		}
	done

	# Signal the leaf itself after the scanner acknowledges the existing inert
	# canary. The finite helper retires normally; no indefinite worker or new
	# production timeout is introduced solely to make this proof pass.
	CANARY_FAULT=signal REAL_JQ="$real_jq" SCANNER_ACK="$CASE_TMP/scanner-ack" \
		PUBLIC_SAFETY_CACHE="$cache" PATH="$bin:$PATH" TMPDIR="$scoped_tmp" \
		"$PREFLIGHT" --surface commit --terms "$terms" --text 'ordinary clean text' \
		>"$CASE_TMP/signal-output" 2>&1 &
	preflight_pid=$!
	for ((count = 0; count < 100; count++)); do
		[[ -s "$CASE_TMP/scanner-ack" ]] && break
		kill -0 "$preflight_pid" 2>/dev/null || break
		sleep 0.05
	done
	if [[ ! -s "$CASE_TMP/scanner-ack" ]]; then
		kill -TERM "$preflight_pid" 2>/dev/null
		wait "$preflight_pid" 2>/dev/null
		echo '    signal scanner never acknowledged the fixture' >&2
		return 1
	fi
	scanner_pid=$(<"$CASE_TMP/scanner-ack")
	if ! kill -0 "$scanner_pid" 2>/dev/null; then
		wait "$preflight_pid" 2>/dev/null
		echo '    acknowledged scanner retired before the signal probe' >&2
		return 1
	fi
	kill -TERM "$preflight_pid" || return 1
	for ((count = 0; count < 100; count++)); do
		kill -0 "$preflight_pid" 2>/dev/null || break
		sleep 0.05
	done
	if kill -0 "$preflight_pid" 2>/dev/null; then
		kill -KILL "$preflight_pid" 2>/dev/null
		wait "$preflight_pid" 2>/dev/null
		echo '    interrupted preflight did not retire within the bound' >&2
		return 1
	fi
	wait "$preflight_pid"
	rc=$?
	[[ "$rc" -ne 0 ]] || {
		echo '    interrupted preflight unexpectedly passed' >&2
		return 1
	}
	out=$(<"$CASE_TMP/signal-output")
	assert_absent "$marker" "$out" || return 1
	assert_absent "$payload" "$out" || return 1
	leftovers=$(find "$scoped_tmp" -mindepth 1 -maxdepth 1)
	[[ -z "$leftovers" ]] || {
		echo '    interrupted preflight left a workspace' >&2
		return 1
	}
	if kill -0 "$scanner_pid" 2>/dev/null; then
		echo '    interrupted scanner survived' >&2
		return 1
	fi
	printf '    TERM leaf PID %s and scanner PID %s retired; scoped workspace absent\n' "$preflight_pid" "$scanner_pid"
	[[ ! -s "$OPENSSL_ATTEMPTS" ]] || {
		echo '    canary invoked prohibited key generation' >&2
		return 1
	}
}
