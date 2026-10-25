# shellcheck shell=bash
# A scanner cache never exposes a scanner without its stamp. The bootstrap extracts
# and stamps the pinned scanner in a staging directory and publishes the whole entry
# with one rename, so an overlapping, killed, or race-losing run never leaves a
# scanner at the cache path without its record. A cache hit is verified against its
# stamp, and an entry with no matching stamp is refused rather than re-downloaded.
#
# Offline. The download is a fake curl that writes dummy bytes. The digest tool
# answers the approved digest for the tarball and delegates everything else. The fake
# tar copies a stub scanner into place and can hold, which keeps a real run paused
# between extraction and stamping. Every wait is bounded, and a case signals only a
# process it started itself.

# The approved digest for a platform, read from the wrapper itself, so the fake
# download is held to the value the wrapper approves and not to a copy kept here.
approved_digest() {
	awk -v p="$1" -F'"' 'index($0, p ") echo") > 0 { print $2; exit }' "$PREFLIGHT"
}

host_platform() {
	local os arch
	case "$(uname -s)" in
	Darwin) os=darwin ;;
	Linux) os=linux ;;
	*) return 1 ;;
	esac
	case "$(uname -m)" in
	x86_64 | amd64) arch=amd64 ;;
	arm64 | aarch64) arch=arm64 ;;
	*) return 1 ;;
	esac
	printf '%s_%s' "$os" "$arch"
}

digest_file() {
	if command -v shasum >/dev/null 2>&1; then
		shasum -a 256 "$1" | cut -d' ' -f1
	else
		sha256sum "$1" | cut -d' ' -f1
	fi
}

# A stub scanner implementing the part of TruffleHog's contract the wrapper depends
# on: newline-delimited JSON records on stdout, 183 when it found something, 0 when
# it did not. It finds the inert canary and nothing else.
write_stub_scanner() {
	local path=$1
	cat >"$path" <<-'STUB'
		#!/usr/bin/env bash
		set -uo pipefail
		dir=""
		for arg in "$@"; do
			[[ -d "$arg" ]] && dir="$arg"
		done
		found=0
		while IFS= read -r file; do
			line=$(grep -nE -- 'ghp_[A-Za-z0-9_]{36,255}' "$file" 2>/dev/null | head -1 | cut -d: -f1)
			[[ -z "$line" ]] && continue
			found=1
			value=$(grep -oE -- 'ghp_[A-Za-z0-9_]{36,255}' "$file" 2>/dev/null | head -1)
			printf '{"DetectorName":"Github","Raw":"%s","SourceMetadata":{"Data":{"Filesystem":{"file":"%s","line":%s}}}}\n' "$value" "$file" "$line"
		done < <(find "$dir" -type f 2>/dev/null | sort)
		[[ "$found" -eq 1 ]] && exit 183
		exit 0
	STUB
	chmod +x "$path"
}

# Installs the fake download and tools. Each answers only the call the wrapper makes;
# anything else reaches the real tool found on the original PATH.
install_fakes() {
	mkdir -p "$BIN" || return 1

	cat >"$BIN/curl" <<-'SH'
		#!/usr/bin/env bash
		# Fake curl: records that a download was attempted and writes dummy bytes to -o.
		: >"$FAKE_SCENARIO/curl-called"
		out=""
		while [[ $# -gt 0 ]]; do
			if [[ "$1" == -o ]]; then
				out=${2:-}
				shift
			fi
			shift
		done
		[[ -n "$out" ]] || exit 2
		printf 'not a real archive\n' >"$out"
	SH

	cat >"$BIN/tar" <<-'SH'
		#!/usr/bin/env bash
		# Fake tar: answers the wrapper's one extraction and hands every other call to the real tar.
		if [[ "$1" != -xzf || "$3" != -C || "$5" != trufflehog ]]; then
			exec env PATH="$FAKE_ORIG_PATH" tar "$@"
		fi
		dest=$4
		case "${FAKE_TAR_MODE:-normal}" in
		tar-fail)
			printf 'partial' >"$dest/trufflehog"
			exit 1
			;;
		dangling)
			ln -s "$CASE_TMP/absent" "$dest/trufflehog"
			exit 0
			;;
		esac
		cp "$STUB" "$dest/trufflehog" || exit 1
		if [[ "${FAKE_TAR_MODE:-normal}" == hold ]] && mkdir "$FAKE_SCENARIO/first-extraction" 2>/dev/null; then
			# The first extraction stops here: the binary is in place and the wrapper has
			# not stamped it yet. It resumes on release, and exits when the wrapper that
			# started it is gone, so nothing waits forever.
			: >"$FAKE_SCENARIO/extracted"
			for ((i = 0; i < 600; i++)); do
				[[ -e "$FAKE_SCENARIO/release" ]] && exit 0
				kill -0 "$PPID" 2>/dev/null || exit 1
				sleep 0.1
			done
			exit 1
		fi
		exit 0
	SH

	cat >"$BIN/shasum" <<-'SH'
		#!/usr/bin/env bash
		# Fake digest tool. The pinned tarball gets the approved digest, or an override.
		# A scanner in a staging directory can be made to fail its digest. Every other
		# file is digested by the real tool of the same name.
		name=${0##*/}
		last=""
		for arg; do
			last=$arg
		done
		case "$last" in
		*/trufflehog.tar.gz)
			printf '%s  %s\n' "${FAKE_TARBALL_DIGEST:-$FAKE_WANT}" "$last"
			exit 0
			;;
		*/trufflehog)
			[[ "${FAKE_DIGEST_FAIL:-0}" == 1 ]] && exit 1
			;;
		esac
		exec env PATH="$FAKE_ORIG_PATH" "$name" "$@"
	SH
	cp "$BIN/shasum" "$BIN/sha256sum" || return 1

	cat >"$BIN/mv" <<-'SH'
		#!/usr/bin/env bash
		# Fake mv. With FAKE_MV_RACE=1, the first publish of a staging directory loses a
		# race: a complete winning run publishes the entry just before this rename.
		case "$*" in
		*.stage.*)
			if [[ "${FAKE_MV_RACE:-0}" == 1 ]] && mkdir "$FAKE_SCENARIO/mv-raced" 2>/dev/null; then
				"$PREFLIGHT" --surface commit --terms "$TERMS" --text 'ordinary clean text' \
					>"$FAKE_SCENARIO/winner-output" 2>&1
				printf '%s' "$?" >"$FAKE_SCENARIO/winner-exit"
			fi
			;;
		esac
		exec env PATH="$FAKE_ORIG_PATH" mv "$@"
	SH
	chmod +x "$BIN/curl" "$BIN/tar" "$BIN/shasum" "$BIN/sha256sum" "$BIN/mv" || return 1
}

# Sets the per-scenario state. Each scenario gets its own cache and its own fake-tar
# bookkeeping, so none can observe another scenario's extraction.
use_scenario() {
	SCN="$CASE_TMP/$1"
	CACHE="$SCN/cache"
	PARENT="$CACHE/trufflehog/3.97.1"
	FINAL="$PARENT/$PLAT"
	rm -rf "$SCN"
	mkdir -p "$SCN" || return 1
	export FAKE_SCENARIO="$SCN"
}

# One run of the wrapper against this scenario's cache. Arguments: the fake tar mode,
# and optionally a tarball digest override. Prints the run's output.
run_once() {
	FAKE_TAR_MODE="$1" FAKE_TARBALL_DIGEST="${2:-}" PATH="$BIN:$PATH" PUBLIC_SAFETY_CACHE="$CACHE" \
		"$PREFLIGHT" --surface commit --terms "$TERMS" --text 'ordinary clean text' 2>&1
}

# Starts a run in the background whose first extraction is held. Sets HELD_PID to
# the wrapper's own PID, which is the only process this case ever signals.
start_held_run() {
	FAKE_TAR_MODE=hold PATH="$BIN:$PATH" PUBLIC_SAFETY_CACHE="$CACHE" \
		"$PREFLIGHT" --surface commit --terms "$TERMS" --text 'ordinary clean text' \
		>"$SCN/held-output" 2>&1 &
	HELD_PID=$!
}

# Waits, bounded, for a file to appear while the given process is alive.
wait_for_file() {
	local i
	for ((i = 0; i < 100; i++)); do
		[[ -e "$1" ]] && return 0
		kill -0 "$2" 2>/dev/null || return 1
		sleep 0.1
	done
	return 1
}

# Waits, bounded, for a background process this case started. It is signalled only
# if it overruns the bound.
reap_bounded() {
	local pid=$1 i
	for ((i = 0; i < 300; i++)); do
		kill -0 "$pid" 2>/dev/null || break
		sleep 0.1
	done
	if kill -0 "$pid" 2>/dev/null; then
		kill -KILL "$pid" 2>/dev/null
		wait "$pid" 2>/dev/null
		return 124
	fi
	wait "$pid"
}

# A cache path that holds a binary without its stamp is the exposure this case exists to catch.
exposed() {
	[[ -e "$1/trufflehog" && ! -e "$1/trufflehog.sha256" ]]
}

# Staging directories are the only other entries a run may leave in the version directory.
staged_entries() {
	find "$1" -mindepth 1 -maxdepth 1 -name '.stage.*' 2>/dev/null
}

note() {
	printf '    %s\n' "$*" >&2
	FAILS=$((FAILS + 1))
}

expect_exit() {
	assert_exit "$@" || FAILS=$((FAILS + 1))
}

# A published entry holds exactly its scanner and its stamp, and the stamp is that scanner's digest.
check_entry() {
	local label=$1
	if [[ ! -e "$FINAL/trufflehog" || ! -e "$FINAL/trufflehog.sha256" ]]; then
		note "$label: the cache path does not hold a scanner with its stamp"
		return 0
	fi
	if [[ "$(ls -A "$FINAL")" != $'trufflehog\ntrufflehog.sha256' ]]; then
		note "$label: the published entry holds more than its scanner and stamp"
	fi
	if [[ "$(digest_file "$FINAL/trufflehog")" != "$(cat "$FINAL/trufflehog.sha256")" ]]; then
		note "$label: the stamp does not match the published scanner"
	fi
	return 0
}

# A run that must be refused before anything is published: the exit code, the
# refusal's wording, and no entry or staging directory left behind.
expect_refused() {
	# expect_refused <exit code> <output> <needle> <what>
	expect_exit 2 "$1" "exit code for $4"
	assert_contains "scan-error" "$2" "refusal for $4" || FAILS=$((FAILS + 1))
	assert_contains "$3" "$2" "refusal for $4" || FAILS=$((FAILS + 1))
	if [[ -e "$FINAL" ]]; then
		note "$4 left an entry at the cache path"
	fi
	if [[ -n "$(staged_entries "$PARENT")" ]]; then
		note "$4 left its staging directory"
	fi
}

# A first run on an empty cache downloads once, publishes a stamped entry, and leaves nothing staged.
first_run_scenario() {
	local out rc
	use_scenario first-run || {
		note "cannot prepare the first-run scenario"
		return 1
	}
	out=$(run_once normal)
	rc=$?
	expect_exit 0 "$rc" "exit code of a first run"
	if [[ "$rc" -ne 0 ]]; then
		printf '    the first run printed: %s\n' "$(tail -1 <<<"$out")" >&2
	fi
	[[ -e "$SCN/curl-called" ]] || note "a first run did not download the pinned scanner"
	check_entry first-run
	if [[ -n "$(staged_entries "$PARENT")" ]]; then
		note "a first run left a staging directory"
	fi
}

# Two first-time runs overlap. The first is paused between extraction and stamping;
# the second must complete, and the first must then use the published entry.
overlap_scenario() {
	local out rc_a rc_b
	use_scenario overlap || {
		note "cannot prepare the overlap scenario"
		return 1
	}
	start_held_run
	if wait_for_file "$SCN/extracted" "$HELD_PID"; then
		if exposed "$FINAL"; then
			note "paused between extraction and stamping, a scanner is at the cache path without its stamp"
		fi
	else
		note "the held run never reached extraction"
	fi

	out=$(run_once normal)
	rc_b=$?
	expect_exit 0 "$rc_b" "exit code of the overlapping run"
	if [[ "$rc_b" -ne 0 ]]; then
		printf '    the overlapping run printed: %s\n' "$(tail -1 <<<"$out")" >&2
	fi

	: >"$SCN/release"
	reap_bounded "$HELD_PID"
	rc_a=$?
	expect_exit 0 "$rc_a" "exit code of the paused run"

	check_entry overlap
	if [[ "$(ls -A "$PARENT" 2>/dev/null)" != "$PLAT" ]]; then
		note "overlap: the version directory holds more than the one published entry"
	fi
	if [[ -n "$(staged_entries "$PARENT")" ]]; then
		note "overlap: a staging directory was left behind"
	fi
}

# Two runs race on the publish itself. The winner publishes after this run has
# checked that the entry is absent and before this run renames. The rename then
# lands inside the winner's entry, so this run must discard that copy and keep the
# winner's entry exactly as it was published.
rename_race_scenario() {
	local out rc
	use_scenario rename-race || {
		note "cannot prepare the rename-race scenario"
		return 1
	}
	export FAKE_MV_RACE=1
	out=$(run_once normal)
	rc=$?
	export FAKE_MV_RACE=0
	expect_exit 0 "$rc" "exit code of the run that loses the rename race"
	if [[ ! -e "$SCN/mv-raced" ]]; then
		note "rename race: the race was never injected, so the scenario proved nothing"
	fi
	if [[ "$(cat "$SCN/winner-exit" 2>/dev/null)" != 0 ]]; then
		note "rename race: the winning run did not complete"
	fi
	check_entry rename-race
	if [[ "$(ls -A "$PARENT" 2>/dev/null)" != "$PLAT" ]]; then
		note "rename race: the version directory holds more than the one published entry"
	fi
	if [[ -n "$(staged_entries "$PARENT")" ]]; then
		note "rename race: a staging directory was left behind"
	fi
}

# A run is killed between extraction and stamping. No entry may appear at the cache
# path, and a fresh run must still bootstrap cleanly.
killed_scenario() {
	local out rc
	use_scenario killed || {
		note "cannot prepare the killed-run scenario"
		return 1
	}
	start_held_run
	if ! wait_for_file "$SCN/extracted" "$HELD_PID"; then
		note "the run to be killed never reached extraction"
	fi

	# SIGKILL reaches only the wrapper this case started. Its held tar is left alone:
	# it exits on its own once the wrapper that started it is gone.
	kill -KILL "$HELD_PID" 2>/dev/null
	wait "$HELD_PID" 2>/dev/null

	if [[ -e "$FINAL" ]]; then
		note "a killed run left an entry at the cache path"
	fi

	out=$(run_once normal)
	rc=$?
	expect_exit 0 "$rc" "exit code of a fresh run after the killed run"
	if [[ "$rc" -ne 0 ]]; then
		printf '    the fresh run printed: %s\n' "$(tail -1 <<<"$out")" >&2
	fi
	check_entry killed
}

# A run is terminated while paused between extraction and stamping. It must refuse,
# publish nothing, and leave no staging directory behind.
terminated_scenario() {
	local rc
	use_scenario terminated || {
		note "cannot prepare the terminated-run scenario"
		return 1
	}
	start_held_run
	if ! wait_for_file "$SCN/extracted" "$HELD_PID"; then
		note "the run to be terminated never reached extraction"
	fi

	# The wrapper runs its trap only after the foreground extraction returns, so the
	# hold is released after the signal.
	kill -TERM "$HELD_PID" 2>/dev/null
	: >"$SCN/release"
	reap_bounded "$HELD_PID"
	rc=$?
	expect_exit 2 "$rc" "exit code of a terminated run"
	assert_contains "scan-error interrupted" "$(cat "$SCN/held-output")" "refusal of a terminated run" ||
		FAILS=$((FAILS + 1))
	if [[ -e "$FINAL" ]]; then
		note "a terminated run published a scanner"
	fi
	if [[ -n "$(staged_entries "$PARENT")" ]]; then
		note "a terminated run left its staging directory"
	fi
}

# Extraction, or the digest of what was extracted, fails after it began. Each refusal
# must leave no staging directory and no entry at the cache path.
extraction_faults_scenario() {
	local out rc
	use_scenario tar-fail || {
		note "cannot prepare the tar-fail scenario"
		return 1
	}
	out=$(run_once tar-fail)
	rc=$?
	expect_refused "$rc" "$out" "cannot extract the pinned scanner" "a failed extraction"

	use_scenario dangling || {
		note "cannot prepare the dangling scenario"
		return 1
	}
	out=$(run_once dangling)
	rc=$?
	expect_refused "$rc" "$out" "cannot make the scanner executable" "a dangling extraction"

	use_scenario stamp-digest-fail || {
		note "cannot prepare the stamp-digest-fail scenario"
		return 1
	}
	export FAKE_DIGEST_FAIL=1
	out=$(run_once normal)
	rc=$?
	export FAKE_DIGEST_FAIL=0
	expect_refused "$rc" "$out" "cannot record what was extracted" "a failed stamp digest"
}

# The tarball digest gate is not weakened: a mismatch refuses before extraction.
digest_mismatch_scenario() {
	local out rc
	use_scenario digest-mismatch || {
		note "cannot prepare the digest-mismatch scenario"
		return 1
	}
	out=$(run_once normal 0000000000000000000000000000000000000000000000000000000000000000)
	rc=$?
	expect_refused "$rc" "$out" "digest mismatch" "a tarball digest mismatch"
}

# A binary with no stamp at the cache path is refused, not re-downloaded and not stamped.
unstamped_scenario() {
	local out rc
	use_scenario unstamped || {
		note "cannot prepare the unstamped scenario"
		return 1
	}
	mkdir -p "$FINAL" || return 1
	cp "$STUB" "$FINAL/trufflehog" || return 1
	chmod +x "$FINAL/trufflehog" || return 1

	out=$(run_once normal)
	rc=$?
	expect_exit 2 "$rc" "exit code for a scanner with no stamp at the cache path"
	assert_contains "carries no record" "$out" "refusal of an unstamped scanner" ||
		FAILS=$((FAILS + 1))
	if [[ -e "$SCN/curl-called" ]]; then
		note "an unstamped scanner sent the run to the network"
	fi
	if [[ -e "$FINAL/trufflehog.sha256" ]]; then
		note "an unstamped scanner was stamped by the run"
	fi
}

# A stamp that does not match the scanner beside it is refused, and the stamp is left as it was.
mismatched_stamp_scenario() {
	local out rc
	use_scenario mismatched-stamp || {
		note "cannot prepare the mismatched-stamp scenario"
		return 1
	}
	mkdir -p "$FINAL" || return 1
	cp "$STUB" "$FINAL/trufflehog" || return 1
	chmod +x "$FINAL/trufflehog" || return 1
	printf '%064d\n' 0 >"$FINAL/trufflehog.sha256" || return 1

	out=$(run_once normal)
	rc=$?
	expect_exit 2 "$rc" "exit code for a scanner whose stamp does not match"
	assert_contains "does not match what was extracted" "$out" "refusal of a mismatched stamp" ||
		FAILS=$((FAILS + 1))
	if [[ -e "$SCN/curl-called" ]]; then
		note "a mismatched stamp sent the run to the network"
	fi
	if [[ "$(cat "$FINAL/trufflehog.sha256")" != "$(printf '%064d' 0)" ]]; then
		note "a mismatched stamp was rewritten by the run"
	fi
}

# A stamped entry whose digest matches is used as it stands, with no download.
stamped_scenario() {
	local out rc
	use_scenario stamped || {
		note "cannot prepare the stamped scenario"
		return 1
	}
	mkdir -p "$FINAL" || return 1
	cp "$STUB" "$FINAL/trufflehog" || return 1
	chmod +x "$FINAL/trufflehog" || return 1
	digest_file "$FINAL/trufflehog" >"$FINAL/trufflehog.sha256" || return 1

	out=$(run_once normal)
	rc=$?
	expect_exit 0 "$rc" "exit code for a verified cache entry"
	if [[ -e "$SCN/curl-called" ]]; then
		note "a verified cache entry sent the run to the network"
	fi
	check_entry stamped
}

# An empty platform directory left by an earlier run must not block publication.
empty_leftover_scenario() {
	local out rc
	use_scenario empty-leftover || {
		note "cannot prepare the empty-leftover scenario"
		return 1
	}
	mkdir -p "$FINAL" || return 1

	out=$(run_once normal)
	rc=$?
	expect_exit 0 "$rc" "exit code with an empty leftover platform directory"
	if [[ "$rc" -ne 0 ]]; then
		printf '    the run printed: %s\n' "$(tail -1 <<<"$out")" >&2
	fi
	check_entry empty-leftover
	if [[ -n "$(staged_entries "$PARENT")" ]]; then
		note "an empty leftover left a staging directory"
	fi
}

run() {
	local plat want
	FAILS=0
	plat=$(host_platform) || {
		echo "    this host is outside the pinned platform matrix" >&2
		return 1
	}
	want=$(approved_digest "$plat")
	if [[ ! "$want" =~ ^[0-9a-f]{64}$ ]]; then
		echo "    no approved digest is recorded for this host" >&2
		return 1
	fi

	PLAT=$plat
	TERMS="$CASE_TMP/terms.txt"
	BIN="$CASE_TMP/fake-bin"
	STUB="$CASE_TMP/stub-scanner"
	write_synthetic_terms "$TERMS"
	write_stub_scanner "$STUB"
	export PLAT TERMS BIN STUB CASE_TMP FAKE_ORIG_PATH="$PATH" FAKE_WANT="$want"
	export FAKE_MV_RACE=0 FAKE_DIGEST_FAIL=0
	install_fakes || return 1

	first_run_scenario
	overlap_scenario
	rename_race_scenario
	killed_scenario
	terminated_scenario
	extraction_faults_scenario
	digest_mismatch_scenario
	unstamped_scenario
	mismatched_stamp_scenario
	stamped_scenario
	empty_leftover_scenario

	[[ "$FAILS" -eq 0 ]]
}
