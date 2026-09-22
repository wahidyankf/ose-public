#!/bin/sh
# The adapter for BeaverNest's specs/tools/rhino-consumer/behaviours/rhino-bootstrap.feature.
#
# This is a documented fork of .github/scripts/test-hippo-bootstrap.sh. The two
# consumers pin releases of different tools, but the hazard they defend against
# is the same one -- a machine-wide cache that several checkouts install into
# concurrently -- so the fixtures are deliberately the same shape. Where this
# file differs from its origin, it differs because RHINO differs:
#
#   * RHINO has no runtime configuration of its own, so there is no local policy
#     example to compare against.
#   * RHINO's release assets are named for Rust target triples, so the platform
#     the suite resolves is a triple rather than a goos/goarch pair.
#   * RHINO's wrapper passes its argument vector through untouched. HIPPO's maps
#     repository-specific worker settings ahead of it; the absence of any such
#     mapping is asserted here rather than left implied.
#   * Two scenarios are RHINO's own: platform refusal before any transport, and
#     the disjointness of the two bootstraps' state on a shared machine.
#
# Contention is choreographed through gates rather than through timing. A
# fixture that waits a while and then continues turns a race that never happened
# into a test that passes, so every wait here is bounded and every bound fails
# loudly.
set -eu

repository_root=$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)
temporary_root=$(mktemp -d)
trap 'rm -rf -- "$temporary_root"' EXIT HUP INT TERM

# Build a synthetic tagged asset whose identity and digest are deterministic;
# the test never depends on GitHub or the machine's real installation cache.
subject="$temporary_root/consumer/rhino"
mkdir -p "$temporary_root/consumer" "$temporary_root/fake-bin" "$temporary_root/stat-bin" "$temporary_root/payload"
cp "$repository_root/rhino" "$subject"

chmod 755 "$subject"

# The suite runs on both Linux and macOS runners. Pinning the fake uname to one
# platform would send the wrapper down the wrong locking branch -- flock on
# Linux, lockf on Darwin -- so the real branch for the host is never exercised
# and the other one cannot even resolve its tool. Derive the platform from the
# real host, and let a scenario still override it explicitly.
case "$(uname -s)" in
Darwin) host_system=apple-darwin ;;
Linux) host_system=unknown-linux-gnu ;;
*)
	echo "unsupported host operating system for the bootstrap suite" >&2
	exit 125
	;;
esac
case "$(uname -m)" in
x86_64 | amd64) host_architecture=x86_64 ;;
arm64 | aarch64) host_architecture=aarch64 ;;
*)
	echo "unsupported host architecture for the bootstrap suite" >&2
	exit 125
	;;
esac
# A Rust target triple, because that is what the release assets are named for.
host_platform="$host_architecture-$host_system"
RHINO_TEST_HOST_UNAME_S=$(uname -s)
RHINO_TEST_HOST_UNAME_M=$(uname -m)
export RHINO_TEST_HOST_UNAME_S RHINO_TEST_HOST_UNAME_M

# Which dialect the host's own stat speaks, so the timestamp fixture can hand
# back true values while presenting the other platform's interface.
real_stat=$(command -v stat)
if "$real_stat" -c '%Y' "$temporary_root" >/dev/null 2>&1; then
	RHINO_TEST_HOST_STAT=gnu
else
	RHINO_TEST_HOST_STAT=bsd
fi
export RHINO_TEST_HOST_STAT

test_version=v9.8.7
test_commit=0123456789abcdef0123456789abcdef01234567
# `probe` is not a RHINO command, and never will be. The payload here is a stub,
# and giving the wrapper an argument the real product does not own keeps the
# marker it echoes from ever reading as a claim about a validator. What the
# marker proves is narrower and is the whole point: the wrapper executed the
# payload it verified.
cat >"$temporary_root/payload/rhino" <<EOF
#!/bin/sh
if [ "\${1:-}" = version ] && [ "\${2:-}" = --json ]; then
  if [ -n "\${RHINO_TEST_IDENTITY:-}" ]; then
    printf '%s\n' "\$RHINO_TEST_IDENTITY"
  else
    printf '%s\n' '{"schemaVersion":1,"version":"$test_version","commit":"$test_commit"}'
  fi
else
  if [ -n "\${RHINO_TEST_ARGUMENTS:-}" ]; then
    : > "\$RHINO_TEST_ARGUMENTS"
    for argument in "\$@"; do
      printf '%s\n' "\$argument" >> "\$RHINO_TEST_ARGUMENTS"
    done
  fi
  # Staying alive inside the release is how a consumer that is *using* a release
  # is represented: the wrapper has already released its install guard by the
  # time this runs, so a peer's retention pass meets a live claim rather than a
  # live installer.
  if [ -n "\${RHINO_TEST_PAYLOAD_WAIT:-}" ]; then
    payload_attempt=0
    while [ ! -e "\$RHINO_TEST_PAYLOAD_WAIT" ]; do
      payload_attempt=\$((payload_attempt + 1))
      [ "\$payload_attempt" -lt 400 ] || exit 96
      /bin/sleep 0.05
    done
  fi
  printf '%s\n' 'probe-ok'
fi
EOF
chmod 755 "$temporary_root/payload/rhino"
tar -czf "$temporary_root/release.tar.gz" -C "$temporary_root/payload" rhino

# PATH-local curl and uname fixtures exercise download and platform branches
# while leaving the bootstrap's production checksum path intact.
cat >"$temporary_root/fake-bin/curl" <<'EOF'
#!/bin/sh
set -eu
if [ "${RHINO_TEST_CURL_FAIL:-}" = 1 ]; then
  exit 99
fi
destination=
requested_url=
while [ "$#" -gt 0 ]; do
  if [ "$1" = --output ]; then
    destination=$2
    shift 2
  else
    requested_url=$1
    shift
  fi
done
# The gate is what makes contention observable without measuring time:
# transport announces that it is in flight and then blocks until the test
# releases it, so a second consumer can be started and inspected while the
# first provably holds the install.
if [ -n "${RHINO_TEST_CURL_GATE:-}" ]; then
  : > "$RHINO_TEST_CURL_GATE/in-flight.$$"
  gate_attempt=0
  while [ ! -e "$RHINO_TEST_CURL_GATE/release" ]; do
    gate_attempt=$((gate_attempt + 1))
    [ "$gate_attempt" -lt 400 ] || exit 96
    /bin/sleep 0.05
  done
fi
cp "$RHINO_TEST_ARCHIVE" "$destination"
if [ -n "${RHINO_TEST_CURL_DELAY:-}" ]; then
  sleep "$RHINO_TEST_CURL_DELAY"
fi
printf '%s\n' "$requested_url" >> "$RHINO_TEST_CURL_COUNT"
EOF
chmod 755 "$temporary_root/fake-bin/curl"

cat >"$temporary_root/fake-bin/uname" <<'EOF'
#!/bin/sh
case "$1" in
  -s) printf '%s\n' "${RHINO_TEST_UNAME_S:-$RHINO_TEST_HOST_UNAME_S}" ;;
  -m) printf '%s\n' "${RHINO_TEST_UNAME_M:-$RHINO_TEST_HOST_UNAME_M}" ;;
  *) exit 2 ;;
esac
EOF
chmod 755 "$temporary_root/fake-bin/uname"

cat >"$temporary_root/fake-bin/sleep" <<'EOF'
#!/bin/sh
if [ "${RHINO_TEST_SLEEP_FAIL:-}" = 1 ]; then
  exit 97
fi
exec /bin/sleep "$@"
EOF
chmod 755 "$temporary_root/fake-bin/sleep"

# A stat that presents one platform's interface on either host. In `gnu` mode
# the BSD `-f` form means "filesystem status": a block of filesystem prose on
# standard output, then a failure on the format operand -- which is exactly the
# shape that makes a `stat -f ... || stat -c ...` fallback chain rank releases
# by prose instead of by time. In `bsd` mode the GNU `-c` form is simply not a
# thing. Values that are returned are the host's real ones.
cat >"$temporary_root/stat-bin/stat" <<EOF
#!/bin/sh
form=\$1
requested_format=\$2
subject_path=\$3
case "\${RHINO_TEST_STAT_EMULATE:-}:\$form" in
gnu:-f)
  printf '  File: "%s"\n  ID: 0 Namelen: 255 Type: apfs\n' "\$subject_path"
  exit 1
  ;;
bsd:-c)
  echo "stat: illegal option -- c" >&2
  exit 1
  ;;
esac
case "\$requested_format" in
'%m' | '%Y') bsd_format='%m'; gnu_format='%Y' ;;
*) bsd_format=\$requested_format; gnu_format=\$requested_format ;;
esac
if [ "\$RHINO_TEST_HOST_STAT" = gnu ]; then
  exec "$real_stat" -c "\$gnu_format" "\$subject_path"
else
  exec "$real_stat" -f "\$bsd_format" "\$subject_path"
fi
EOF
chmod 755 "$temporary_root/stat-bin/stat"

# Simulating the other platform's timestamp interface also selects that
# platform's file-locking tool, which the host may not have. Only one consumer
# runs in that scenario, so the guard has nothing to serialize; it is stubbed
# there and tested for real by every contention scenario on the host's own
# branch.
for stubbed_lock in flock lockf; do
	cat >"$temporary_root/stat-bin/$stubbed_lock" <<'EOF'
#!/bin/sh
exit 0
EOF
	chmod 755 "$temporary_root/stat-bin/$stubbed_lock"
done

if command -v sha256sum >/dev/null 2>&1; then
	checksum=$(sha256sum "$temporary_root/release.tar.gz" | awk '{print $1}')
else
	checksum=$(shasum -a 256 "$temporary_root/release.tar.gz" | awk '{print $1}')
fi
hash_stream() {
	if command -v sha256sum >/dev/null 2>&1; then
		sha256sum | awk '{print $1}'
	else
		shasum -a 256 | awk '{print $1}'
	fi
}
write_lock() {
	lock_version=$1
	lock_checksum=$2
	cat >"$temporary_root/consumer/rhino.lock" <<EOF
version=$lock_version
commit=$test_commit
aarch64-apple-darwin=$lock_checksum
x86_64-apple-darwin=$lock_checksum
aarch64-unknown-linux-gnu=$lock_checksum
x86_64-unknown-linux-gnu=$lock_checksum
EOF
}

write_lock "$test_version" "$checksum"

test_path="$temporary_root/fake-bin:$PATH"
cache_root="$temporary_root/cache"
curl_count="$temporary_root/curl-count"

# Every wait in this suite is bounded and every bound is fatal. A choreography
# that silently gives up is the one failure mode a contention fixture cannot
# report on itself: it degrades into two sequential runs that pass.
wait_for() {
	wait_description=$1
	shift
	wait_attempt=0
	until "$@"; do
		wait_attempt=$((wait_attempt + 1))
		if [ "$wait_attempt" -ge 200 ]; then
			echo "timed out waiting for $wait_description" >&2
			exit 1
		fi
		/bin/sleep 0.05
	done
}

transport_in_flight() {
	[ -n "$(find "$1" -maxdepth 1 -name 'in-flight.*' -print -quit 2>/dev/null)" ]
}

claim_exists_for() {
	[ -n "$(find "$1" -maxdepth 1 -name ".release-claim.$2.*" -print -quit 2>/dev/null)" ]
}

# Prove the append-only fixture itself distinguishes duplicate downloads. A
# broken install lock must not be able to collapse two concurrent fetches into
# one observed count through read/modify/write races.
counter_probe="$temporary_root/counter-probe"
RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$counter_probe" RHINO_TEST_CURL_DELAY=1 \
	"$temporary_root/fake-bin/curl" --output "$temporary_root/probe-one.tar.gz" unused &
counter_probe_one=$!
RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$counter_probe" RHINO_TEST_CURL_DELAY=1 \
	"$temporary_root/fake-bin/curl" --output "$temporary_root/probe-two.tar.gz" unused &
counter_probe_two=$!
wait "$counter_probe_one"
wait "$counter_probe_two"
[ "$(awk 'END { print NR }' "$counter_probe")" -eq 2 ]
rm -f -- "$counter_probe" "$temporary_root/probe-one.tar.gz" "$temporary_root/probe-two.tar.gz"

# This adapter binds every scenario owned by BeaverNest's
# specs/tools/rhino-consumer/behaviours/rhino-bootstrap.feature by exact title.
# Like test-hippo-bootstrap.sh, OSE keeps no copied feature corpus: a caller may
# set RHINO_CANONICAL_FEATURE to that feature in a BeaverNest checkout for
# byte-local cross-repository title validation. The exact-list comparison then
# makes a missing, duplicate, renamed, or unknown scenario fail before any
# fixture runs.
expected_scenarios='A cold cache installs once and a warm cache needs no transport
The caller'"'"'s argument vector reaches the release unchanged
Tampered warm-cache payload never executes
A downloaded archive whose digest misses the pin never executes
Non-exact stable release version is rejected
Exact candidate tag uses stable release identity
Release identity envelope must match exactly
Unsupported platform is refused before any transport
Matching live install-lock owner remains protected
Malformed identity for a live install-lock owner fails closed
Reused live PID with a different valid identity is reclaimed
Dead install-lock owner is reclaimed
Crash before install-lock metadata publication is recoverable
Concurrent cold callers install from exactly one verified download
Concurrent stale reclaimers preserve a replacement live owner
A consumer never removes an install lock it did not publish
Install guard storage stays bounded across release versions
Retention never deletes a release another consumer is using
Retention never evicts a release another repository still uses
Release ranking reads real timestamps on every supported platform
Retention reclaims releases left idle beyond its window
The two consumer bootstraps never reach each other'"'"'s state'
# Said out loud rather than left to `set -e`. This assertion runs before the
# first scenario name is printed, so a bare test exits with no output at all --
# and the one change that trips it, editing the corpus, is also the one where a
# silent exit reads as the whole suite being broken. The titles themselves are
# published in the feature file, so naming them here discloses nothing.
if [ -n "${RHINO_CANONICAL_FEATURE:-}" ]; then
	actual_scenarios=$(awk '/^[[:space:]]*Scenario: / { sub(/^[[:space:]]*Scenario: /, ""); print }' "$RHINO_CANONICAL_FEATURE")
	if [ "$actual_scenarios" != "$expected_scenarios" ]; then
		printf 'the scenario corpus and this adapter disagree\n' >&2
		printf '%s\n' "$actual_scenarios" | sort >"$temporary_root/corpus-actual"
		printf '%s\n' "$expected_scenarios" | sort >"$temporary_root/corpus-expected"
		printf 'only in the feature file:\n' >&2
		comm -23 "$temporary_root/corpus-actual" "$temporary_root/corpus-expected" >&2
		printf 'only in this adapter:\n' >&2
		comm -13 "$temporary_root/corpus-actual" "$temporary_root/corpus-expected" >&2
		exit 1
	fi
fi

prepare_legacy_install_lock() {
	write_lock "$test_version" "$checksum"
	rm -rf -- "$cache_root"
	install_lock="$cache_root/$test_version/$host_platform.lock"
	mkdir -p "$install_lock"
}

prepare_atomic_install_lock() {
	write_lock "$test_version" "$checksum"
	rm -rf -- "$cache_root"
	install_lock="$cache_root/$test_version/$host_platform.lock"
	mkdir -p "$(dirname -- "$install_lock")"
}

download_count() {
	if [ -f "$curl_count" ]; then
		awk 'END { print NR }' "$curl_count"
	else
		printf '%s\n' 0
	fi
}

assert_pinned_release_installed() {
	downloads_before=$1
	[ "$result" = probe-ok ]
	[ "$(download_count)" -eq "$((downloads_before + 1))" ]
	[ -x "$cache_root/$test_version/$host_platform/rhino" ]
	[ -f "$cache_root/$test_version/$host_platform/rhino.sha256" ]
	[ ! -e "$install_lock" ]
}

assert_waits_for_live_lock() {
	set +e
	PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" \
		RHINO_TEST_SLEEP_FAIL=1 "$subject" probe >/dev/null 2>&1
	status=$?
	set -e
	[ "$status" -eq 97 ]
	[ -f "$install_lock" ]
}

run_cold_then_warm_cache() {
	write_lock "$test_version" "$checksum"
	rm -rf -- "$cache_root"
	downloads_before=$(download_count)
	result=$(PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" "$subject" probe)
	[ "$result" = probe-ok ]
	[ "$(download_count)" -eq "$((downloads_before + 1))" ]

	# Transport is not merely unused on the second run, it is broken. A warm
	# cache that quietly re-fetched would fail here rather than pass quietly.
	result=$(PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_CURL_FAIL=1 "$subject" probe)
	[ "$result" = probe-ok ]
	[ "$(download_count)" -eq "$((downloads_before + 1))" ]
	[ -f "$cache_root/$test_version/$host_platform/rhino.sha256" ]
}

# Where HIPPO's consumer maps repository worker settings ahead of the caller's
# arguments, RHINO's passes the vector through untouched. That is a claim about
# the wrapper, not an absence, so it is asserted: a real command spelling goes
# in, and exactly that spelling must come out with nothing added, removed, or
# reordered.
run_argument_vector_passthrough() {
	write_lock "$test_version" "$checksum"
	rm -rf -- "$cache_root"
	result=$(PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" "$subject" probe)
	[ "$result" = probe-ok ]

	arguments_file="$temporary_root/passed-arguments"
	result=$(PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_CURL_FAIL=1 RHINO_TEST_ARGUMENTS="$arguments_file" "$subject" md word-count inspect --file README.md)
	[ "$result" = probe-ok ]
	expected_arguments='md
word-count
inspect
--file
README.md'
	[ "$(sed -n '1,$p' "$arguments_file")" = "$expected_arguments" ]
}

run_tampered_warm_cache() {
	write_lock "$test_version" "$checksum"
	rm -rf -- "$cache_root"
	tamper_marker="$temporary_root/tampered-executed"
	rm -f -- "$tamper_marker"
	result=$(PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" "$subject" probe)
	[ "$result" = probe-ok ]
	cached_binary="$cache_root/$test_version/$host_platform/rhino"

	# A digest mismatch must be rejected before the replacement executes.
	cat >"$cached_binary" <<EOF
#!/bin/sh
: > "$tamper_marker"
exit 0
EOF
	chmod 755 "$cached_binary"
	set +e
	PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_CURL_FAIL=1 "$subject" probe >/dev/null 2>&1
	status=$?
	set -e
	[ "$status" -eq 99 ]
	[ ! -e "$tamper_marker" ]

	# A matching sidecar digest cannot bypass the embedded release identity.
	rm -rf -- "$cache_root"
	result=$(PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" "$subject" probe)
	[ "$result" = probe-ok ]
	cat >"$cached_binary" <<EOF
#!/bin/sh
if [ "\${1:-}" = version ] && [ "\${2:-}" = --json ]; then
  printf '%s\n' '{"schemaVersion":1,"version":"v0.0.0","commit":"$test_commit"}'
else
  : > "$tamper_marker"
fi
EOF
	chmod 755 "$cached_binary"
	hash_stream <"$cached_binary" >"$cached_binary.sha256"
	set +e
	PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_CURL_FAIL=1 "$subject" probe >/dev/null 2>&1
	status=$?
	set -e
	[ "$status" -eq 99 ]
	[ ! -e "$tamper_marker" ]
}

# Integrity failures are configuration errors, not transport errors, and must
# stop before an unverified payload is published or executed.
run_download_digest_mismatch() {
	rm -rf -- "$cache_root"
	write_lock "$test_version" 0000000000000000000000000000000000000000000000000000000000000000
	downloads_before=$(download_count)
	mismatch_output="$temporary_root/digest-mismatch-output"
	set +e
	PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" \
		"$subject" probe >"$mismatch_output" 2>/dev/null
	status=$?
	set -e
	[ "$status" -eq 125 ]
	# The archive was fetched and then refused: nothing of it reached the cache
	# and the payload never spoke.
	[ "$(download_count)" -eq "$((downloads_before + 1))" ]
	[ ! -s "$mismatch_output" ]
	[ ! -e "$cache_root/$test_version/$host_platform/rhino" ]
	write_lock "$test_version" "$checksum"
}

run_non_exact_stable_version() {
	rm -rf -- "$cache_root"
	downloads_before=$(download_count)
	# `v1.2.3/../../../escape` resolves three levels above the cache root, which
	# is one level above the suite's own temporary root -- so that, and not a
	# path inside the sandbox, is where a traversal would land.
	escape_parent=$(dirname -- "$temporary_root")
	for invalid_version in v1x.2.3 v1.2.3- 'v1.2.3-rc.1/../../../escape' 'v1.2.3/../../../escape'; do
		write_lock "$invalid_version" "$checksum"
		set +e
		PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" "$subject" probe >/dev/null 2>&1
		status=$?
		set -e
		[ "$status" -eq 125 ]
	done
	[ "$(download_count)" -eq "$downloads_before" ]
	[ ! -e "$escape_parent/escape" ]
	[ ! -e "$temporary_root/escape" ]
	[ ! -e "$cache_root" ]
	write_lock "$test_version" "$checksum"
}

run_exact_candidate_tag_uses_stable_product_identity() {
	candidate_version=v9.8.7-rc.5
	stable_product_version=v9.8.7
	rm -rf -- "$cache_root"
	write_lock "$candidate_version" "$checksum"
	downloads_before=$(download_count)
	result=$(PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" \
		RHINO_TEST_IDENTITY="{\"schemaVersion\":1,\"version\":\"$stable_product_version\",\"commit\":\"$test_commit\"}" "$subject" probe)
	[ "$result" = probe-ok ]
	[ "$(download_count)" -eq "$((downloads_before + 1))" ]
	[ -x "$cache_root/$candidate_version/$host_platform/rhino" ]
	[ -f "$cache_root/$candidate_version/$host_platform/rhino.sha256" ]
	write_lock "$test_version" "$checksum"
	rm -rf -- "$cache_root"
}

run_non_exact_identity_envelope() {
	write_lock "$test_version" "$checksum"
	rm -rf -- "$cache_root"
	downloads_before=$(download_count)
	set +e
	PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" \
		RHINO_TEST_IDENTITY="{\"schemaVersion\":1,\"version\":\"$test_version\",\"commit\":\"$test_commit\",\"version\":\"v0.0.0\"}" \
		"$subject" probe >/dev/null 2>&1
	status=$?
	set -e
	[ "$status" -eq 125 ]
	[ "$(download_count)" -eq "$((downloads_before + 1))" ]
	[ ! -e "$cache_root/$test_version/$host_platform/rhino" ]
	[ ! -e "$cache_root/$test_version/$host_platform/rhino.sha256" ]
}

# RHINO publishes four target triples and no more. A host outside that matrix
# has no asset to fetch, so the refusal has to come before the transport rather
# than from a download that fails to find one: a 404 read as a network problem
# is the kind of error a caller retries forever. The refusal is attributed by
# its message, because exit 125 is also what an unreadable lock produces -- and
# the platform branch runs before the lock's per-target checksum is ever read.
run_unsupported_platform_refused() {
	write_lock "$test_version" "$checksum"
	rm -rf -- "$cache_root"
	downloads_before=$(download_count)
	refusal="$temporary_root/platform-refusal"

	set +e
	PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" \
		RHINO_TEST_UNAME_S=Plan9 "$subject" probe >/dev/null 2>"$refusal"
	status=$?
	set -e
	[ "$status" -eq 125 ]
	grep -q 'does not support this operating system' "$refusal"

	# An architecture RHINO does not build for is refused on the same terms as
	# an operating system it does not build for.
	set +e
	PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" \
		RHINO_TEST_UNAME_M=riscv64 "$subject" probe >/dev/null 2>"$refusal"
	status=$?
	set -e
	[ "$status" -eq 125 ]
	grep -q 'does not support this architecture' "$refusal"

	[ "$(download_count)" -eq "$downloads_before" ]
	[ ! -e "$cache_root" ]
}

run_matching_live_owner() {
	prepare_atomic_install_lock
	process_start=$(LC_ALL=C ps -o lstart= -p "$$" 2>/dev/null | awk '{$1=$1; print; exit}')
	process_digest=$(printf '%s\n' "$process_start" | hash_stream)
	printf '%s\n%s\n' "$$" "$process_digest" >"$install_lock"
	assert_waits_for_live_lock
}

run_malformed_live_owner() {
	# Every case here is digest-consistent, so each one reaches the identity
	# check rather than being turned away by the record digest before it. The
	# shapes are the three ways a digest can be wrong while looking right: not
	# hexadecimal at all, the right alphabet at the wrong length, and the right
	# length in the wrong case.
	for malformed_identity in 'malformed-process-identity' "$(printf '%063d' 0)" "$(printf '%063d' 0)F"; do
		prepare_atomic_install_lock
		printf '%s\n%s\n' "$$" "$malformed_identity" >"$install_lock"
		assert_waits_for_live_lock
	done

	# A record carrying an extra field is stopped one gate earlier, by the
	# record digest that covers exactly the PID and identity lines. Kept because
	# that gate is what makes the identity check above meaningful.
	prepare_atomic_install_lock
	printf '%s\n%064d\n%s' "$$" 0 'unexpected-field' >"$install_lock"
	assert_waits_for_live_lock
}

run_reused_live_pid() {
	prepare_atomic_install_lock
	printf '%s\n%064d\n' "$$" 0 >"$install_lock"
	downloads_before=$(download_count)
	result=$(PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" \
		RHINO_TEST_SLEEP_FAIL=1 "$subject" probe)
	assert_pinned_release_installed "$downloads_before"
}

run_dead_owner() {
	prepare_atomic_install_lock
	dead_pid=2147483647
	if kill -0 "$dead_pid" 2>/dev/null; then
		exit 1
	fi
	printf '%s\n%s\n' "$dead_pid" 'legacy-process-identity' >"$install_lock"
	downloads_before=$(download_count)
	result=$(PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" \
		RHINO_TEST_SLEEP_FAIL=1 "$subject" probe)
	assert_pinned_release_installed "$downloads_before"
}

run_crash_before_publication() {
	dead_pid=2147483647
	if kill -0 "$dead_pid" 2>/dev/null; then
		exit 1
	fi
	prepare_legacy_install_lock
	downloads_before=$(download_count)
	set +e
	result=$(PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" \
		RHINO_TEST_SLEEP_FAIL=1 "$subject" probe)
	status=$?
	set -e
	[ "$status" -eq 0 ]
	assert_pinned_release_installed "$downloads_before"

	# A legacy owner that published only its now-dead PID is also recoverable.
	prepare_legacy_install_lock
	printf '%s\n' "$dead_pid" >"$install_lock/pid"
	downloads_before=$(download_count)
	result=$(PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" \
		RHINO_TEST_SLEEP_FAIL=1 "$subject" probe)
	assert_pinned_release_installed "$downloads_before"

	# Orphan preparation cleanup requires both conservative expiry and positive
	# owner staleness. Fresh dead-owner and expired matching-live records stay.
	# Sleep still fails: recovery here is immediate, never a wait that outlasts
	# the obstruction.
	write_lock "$test_version" "$checksum"
	rm -rf -- "$cache_root"
	preparation_dir="$cache_root/$test_version"
	mkdir -p "$preparation_dir"
	orphan_identity=$(printf '%064d' 0)
	process_start=$(LC_ALL=C ps -o lstart= -p "$$" 2>/dev/null | awk '{$1=$1; print; exit}')
	live_identity=$(printf '%s\n' "$process_start" | hash_stream)
	expired_orphan="$preparation_dir/.install-owner.$dead_pid.$orphan_identity.expired"
	fresh_orphan="$preparation_dir/.install-owner.$dead_pid.$orphan_identity.fresh"
	live_preparation="$preparation_dir/.install-owner.$$.$live_identity.live"
	: >"$expired_orphan"
	: >"$fresh_orphan"
	: >"$live_preparation"
	touch -t 200001010000 "$expired_orphan" "$live_preparation"
	downloads_before=$(download_count)
	result=$(PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" \
		RHINO_TEST_SLEEP_FAIL=1 "$subject" probe)
	assert_pinned_release_installed "$downloads_before"
	[ ! -e "$expired_orphan" ]
	[ -f "$fresh_orphan" ]
	[ -f "$live_preparation" ]
	rm -f -- "$fresh_orphan" "$live_preparation"
}

# Two normal cold-cache callers contend through the atomically published owner
# record. The second is started only once the first is provably inside
# transport, so this is contention rather than two runs that happened to
# overlap. Both complete from one verified download, and exact-owner cleanup
# leaves neither the published lock nor a prepared-record file behind.
run_concurrent_cold_callers() {
	write_lock "$test_version" "$checksum"
	rm -rf -- "$cache_root"
	gate="$temporary_root/cold-gate"
	rm -rf -- "$gate"
	mkdir -p "$gate"
	downloads_before=$(download_count)
	first_result="$temporary_root/concurrent-first"
	second_result="$temporary_root/concurrent-second"
	PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" \
		RHINO_TEST_CURL_GATE="$gate" "$subject" probe >"$first_result" &
	first_pid=$!
	wait_for "the first cold caller to reach transport" transport_in_flight "$gate"
	PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" \
		RHINO_TEST_CURL_GATE="$gate" "$subject" probe >"$second_result" &
	second_pid=$!
	wait_for "the second cold caller to start" claim_exists_for "$cache_root/$test_version" "$second_pid"
	: >"$gate/release"
	wait "$first_pid"
	wait "$second_pid"
	[ "$(sed -n '1p' "$first_result")" = probe-ok ]
	[ "$(sed -n '1p' "$second_result")" = probe-ok ]
	[ "$(download_count)" -eq "$((downloads_before + 1))" ]
	[ ! -e "$cache_root/$test_version/$host_platform.lock" ]
	[ -z "$(find "$cache_root/$test_version" -name '.install-owner.*' -print -quit)" ]
}

# The hazard is a second consumer arriving after a stale record has been
# reclaimed and destroying the live ownership that replaced it. Reproducing it
# needs the second consumer to be running while the first holds the release, so
# the first is held inside transport and the second is started and confirmed to
# have begun -- it publishes its release claim before it contends for anything
# -- before the replacement record is inspected.
run_concurrent_stale_reclaimers() {
	prepare_atomic_install_lock
	dead_pid=2147483647
	if kill -0 "$dead_pid" 2>/dev/null; then
		exit 1
	fi
	printf '%s\n%064d\n' "$dead_pid" 0 >"$install_lock"
	gate="$temporary_root/reclaim-gate"
	rm -rf -- "$gate"
	mkdir -p "$gate"
	downloads_before=$(download_count)
	first_result="$temporary_root/reclaimer-first"
	second_result="$temporary_root/reclaimer-second"

	PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" \
		RHINO_TEST_CURL_GATE="$gate" "$subject" probe >"$first_result" &
	first_pid=$!
	wait_for "the reclaiming consumer to reach transport" transport_in_flight "$gate"

	# The stale record is gone and the replacement names the consumer that is
	# installing right now.
	[ -f "$install_lock" ]
	[ "$(sed -n '1p' "$install_lock")" = "$first_pid" ]

	PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" \
		RHINO_TEST_CURL_GATE="$gate" "$subject" probe >"$second_result" &
	second_pid=$!
	wait_for "the second contender to start" claim_exists_for "$cache_root/$test_version" "$second_pid"

	# With both consumers running, the replacement is still owned by the first.
	[ -f "$install_lock" ]
	[ "$(sed -n '1p' "$install_lock")" = "$first_pid" ]

	: >"$gate/release"
	set +e
	wait "$first_pid"
	first_status=$?
	wait "$second_pid"
	second_status=$?
	set -e
	[ "$first_status" -eq 0 ]
	[ "$second_status" -eq 0 ]
	[ "$(sed -n '1p' "$first_result")" = probe-ok ]
	[ "$(sed -n '1p' "$second_result")" = probe-ok ]
	[ "$(download_count)" -eq "$((downloads_before + 1))" ]
	[ ! -e "$install_lock" ]
	[ -z "$(find "$cache_root/$test_version" -name '.install-owner.*' -print -quit)" ]
}

# A peer consumer is a second checkout of this same wrapper with its own lock.
# Every repository on a machine resolves to one cache root, so peers exercise
# the cross-repository behaviour that a single subject cannot.
install_peer_consumer() {
	peer_name=$1
	peer_version=$2
	peer_dir="$temporary_root/peers/$peer_name"
	mkdir -p "$peer_dir"
	cp "$repository_root/rhino" "$peer_dir/rhino"
	chmod 755 "$peer_dir/rhino"
	cat >"$peer_dir/rhino.lock" <<PEERLOCK
version=$peer_version
commit=$test_commit
aarch64-apple-darwin=$checksum
x86_64-apple-darwin=$checksum
aarch64-unknown-linux-gnu=$checksum
x86_64-unknown-linux-gnu=$checksum
PEERLOCK
}

run_peer_consumer() {
	peer_name=$1
	peer_version=$2
	peer_delay=$3
	PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" \
		RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" \
		RHINO_TEST_CURL_COUNT="$curl_count" \
		RHINO_TEST_CURL_DELAY="$peer_delay" \
		RHINO_TEST_IDENTITY="{\"schemaVersion\":1,\"version\":\"$peer_version\",\"commit\":\"$test_commit\"}" \
		"$temporary_root/peers/$peer_name/rhino" probe
}

run_retention_protects_installing_release() {
	rm -rf -- "$cache_root" "$curl_count"
	claimed_version=v9.7.2
	pinned_version=v9.7.1
	install_peer_consumer holding "$claimed_version"
	install_peer_consumer pruning "$pinned_version"

	# The claim is published by a real consumer and read by a real peer, so the
	# producer and the reader of that record are both the product. A claim
	# written by the test would prove the reader parses the test's spelling.
	# The holder stays inside its release rather than exiting, which is what a
	# claim exists for: the wrapper releases its install guard before executing
	# the release, so a peer's retention pass genuinely runs alongside it.
	holder_gate="$temporary_root/holder-gate"
	rm -rf -- "$holder_gate"
	mkdir -p "$holder_gate"
	holder_output="$temporary_root/holder-output"
	PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" \
		RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" \
		RHINO_TEST_CURL_COUNT="$curl_count" \
		RHINO_TEST_PAYLOAD_WAIT="$holder_gate/finish" \
		RHINO_TEST_IDENTITY="{\"schemaVersion\":1,\"version\":\"$claimed_version\",\"commit\":\"$test_commit\"}" \
		"$temporary_root/peers/holding/rhino" probe >"$holder_output" &
	holder_pid=$!
	wait_for "the holding consumer to publish its release claim" \
		claim_exists_for "$cache_root/$claimed_version" "$holder_pid"
	wait_for "the holding consumer to enter its release" \
		test -x "$cache_root/$claimed_version/$host_platform/rhino"

	sentinel="$cache_root/$claimed_version/.survives-retention"
	: >"$sentinel"
	# Oldest of all candidates, and outside the ranked budget, so only the claim
	# can save it.
	touch -t 200001010000 "$cache_root/$claimed_version"
	for bystander in v9.6.1 v9.6.2 v9.6.3; do
		mkdir -p "$cache_root/$bystander"
		touch -t 200002010000 "$cache_root/$bystander"
	done

	[ "$(run_peer_consumer pruning "$pinned_version" 0)" = probe-ok ]

	[ -f "$sentinel" ]
	[ -x "$cache_root/$claimed_version/$host_platform/rhino" ]
	[ -x "$cache_root/$pinned_version/$host_platform/rhino" ]
	# Retention still ran: the ranked budget reclaimed exactly one unclaimed
	# idle peer, so the claim is an exemption rather than a disabled prune.
	surviving_bystanders=0
	for bystander in v9.6.1 v9.6.2 v9.6.3; do
		if [ -d "$cache_root/$bystander" ]; then
			surviving_bystanders=$((surviving_bystanders + 1))
		fi
	done
	[ "$surviving_bystanders" -eq 2 ]

	: >"$holder_gate/finish"
	wait "$holder_pid"
	[ "$(sed -n '1p' "$holder_output")" = probe-ok ]
	write_lock "$test_version" "$checksum"
	rm -rf -- "$cache_root" "$curl_count"
}

run_retention_keeps_releases_other_repositories_use() {
	rm -rf -- "$cache_root" "$curl_count"
	sharing_versions='v9.5.1 v9.5.2 v9.5.3 v9.5.4'
	for sharing_version in $sharing_versions; do
		install_peer_consumer "repo$sharing_version" "$sharing_version"
		[ "$(run_peer_consumer "repo$sharing_version" "$sharing_version" 0)" = probe-ok ]
	done
	# One download per distinct pin, and every pin survives every peer's prune.
	[ "$(download_count)" -eq 4 ]
	for sharing_version in $sharing_versions; do
		[ -x "$cache_root/$sharing_version/$host_platform/rhino" ]
	done

	# A second pass must serve every repository warm. Under a ranked-only
	# budget the fourth pin has already been evicted and downloads again.
	for sharing_version in $sharing_versions; do
		[ "$(run_peer_consumer "repo$sharing_version" "$sharing_version" 0)" = probe-ok ]
	done
	[ "$(download_count)" -eq 4 ]
	write_lock "$test_version" "$checksum"
	rm -rf -- "$cache_root" "$curl_count"
}

run_retention_reclaims_idle_releases() {
	rm -rf -- "$cache_root" "$curl_count"
	idle_version=v9.4.9
	install_peer_consumer idle "$idle_version"
	# Distinct far-past timestamps make the recency ordering deterministic.
	idle_stamp=1
	for idle_release in v8.0.1 v8.0.2 v8.0.3 v8.0.4 v8.0.5; do
		mkdir -p "$cache_root/$idle_release"
		touch -t "20000${idle_stamp}010000" "$cache_root/$idle_release"
		idle_stamp=$((idle_stamp + 1))
	done
	[ "$(run_peer_consumer idle "$idle_version" 0)" = probe-ok ]

	# Retention still reclaims genuinely idle releases: only the pinned release
	# and the two most recent idle fallbacks survive.
	[ -x "$cache_root/$idle_version/$host_platform/rhino" ]
	[ -d "$cache_root/v8.0.5" ]
	[ -d "$cache_root/v8.0.4" ]
	[ ! -d "$cache_root/v8.0.3" ]
	[ ! -d "$cache_root/v8.0.2" ]
	[ ! -d "$cache_root/v8.0.1" ]
	write_lock "$test_version" "$checksum"
	rm -rf -- "$cache_root" "$curl_count"
}

# `release_install_lock` removes the lock only while its inode identity and
# record digest are *both* still the ones this process published. A consumer
# whose lock a peer had already reclaimed would otherwise delete the peer's
# replacement on the way out, admitting a third installer into an install that
# is already owned. The branch is reached by every successful install, but only
# ever with a match; the arm that must refuse is reached by nothing else, so the
# record is substituted here while the consumer is provably still inside
# transport and what it does on the way out is observed.
#
# Three substitutions, because the two halves of the comparison are load-bearing
# separately: a different file with a different owner fails both, a rewrite in
# place keeps the inode and breaks only the digest, and a byte-identical copy
# keeps the digest and breaks only the inode. Dropping either conjunct survives
# the other two.
run_never_removes_a_foreign_install_lock() {
	for substitution in foreign-owner rewritten-in-place identical-copy; do
		prepare_atomic_install_lock
		gate="$temporary_root/foreign-lock-gate"
		rm -rf -- "$gate"
		mkdir -p "$gate"
		installer_result="$temporary_root/foreign-lock-installer"
		PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" \
			RHINO_TEST_CURL_GATE="$gate" "$subject" probe >"$installer_result" &
		installer_pid=$!
		wait_for "the installing consumer to reach transport" transport_in_flight "$gate"
		[ "$(sed -n '1p' "$install_lock")" = "$installer_pid" ]

		replacement="$temporary_root/replacement-owner"
		rm -f -- "$replacement"
		case "$substitution" in
		foreign-owner)
			# A peer that reclaimed the lock and published its own record: a
			# different file, a different owner, and this owner is alive.
			process_start=$(LC_ALL=C ps -o lstart= -p "$$" 2>/dev/null | awk '{$1=$1; print; exit}')
			process_digest=$(printf '%s\n' "$process_start" | hash_stream)
			printf '%s\n%s\n' "$$" "$process_digest" >"$replacement"
			rm -f -- "$install_lock"
			ln "$replacement" "$install_lock"
			expected_owner=$$
			;;
		rewritten-in-place)
			# Same inode, different bytes. Only the record digest can notice.
			printf '%s\n%064d\n' "$installer_pid" 1 >"$install_lock"
			expected_owner=$installer_pid
			;;
		*)
			# Same bytes, different inode. Only the file identity can notice.
			cat "$install_lock" >"$replacement"
			rm -f -- "$install_lock"
			ln "$replacement" "$install_lock"
			expected_owner=$installer_pid
			;;
		esac

		: >"$gate/release"
		wait "$installer_pid"
		[ "$(sed -n '1p' "$installer_result")" = probe-ok ]
		# The substituted record is untouched and still names its own owner.
		[ -f "$install_lock" ]
		[ "$(sed -n '1p' "$install_lock")" = "$expected_owner" ]
		rm -f -- "$install_lock" "$replacement"
	done
}

run_bounded_install_guard_storage() {
	rm -rf -- "$cache_root"
	for release_version in v9.8.7 v9.8.8 v9.8.9 v9.8.10; do
		write_lock "$release_version" "$checksum"
		release_identity="{\"schemaVersion\":1,\"version\":\"$release_version\",\"commit\":\"$test_commit\"}"
		result=$(PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" \
			RHINO_TEST_IDENTITY="$release_identity" "$subject" probe)
		[ "$result" = probe-ok ]
	done
	# Retention has to have something to prune, or the scenario's When never
	# happens and the guard count is only ever observed on a cache nothing
	# reclaimed. Three of the four pins are aged past the idle window, so the
	# ranked budget keeps two and reclaims the oldest on the next real install.
	idle_stamp=1
	for aged_release in v9.8.7 v9.8.8 v9.8.9; do
		touch -t "20000${idle_stamp}010000" "$cache_root/$aged_release"
		idle_stamp=$((idle_stamp + 1))
	done
	write_lock v9.8.11 "$checksum"
	result=$(PATH="$test_path" RHINO_INSTALL_CACHE="$cache_root" RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" \
		RHINO_TEST_IDENTITY="{\"schemaVersion\":1,\"version\":\"v9.8.11\",\"commit\":\"$test_commit\"}" "$subject" probe)
	[ "$result" = probe-ok ]
	[ ! -d "$cache_root/v9.8.7" ]
	[ -d "$cache_root/v9.8.8" ]
	[ -d "$cache_root/v9.8.9" ]
	[ -d "$cache_root/v9.8.10" ]
	[ -d "$cache_root/v9.8.11" ]

	guard_count=0
	for guard_path in "$cache_root"/.install-guard.* "$cache_root"/.install-guards/*; do
		if [ -f "$guard_path" ] && [ ! -L "$guard_path" ]; then
			guard_count=$((guard_count + 1))
		fi
	done
	[ "$guard_count" -eq 1 ]
	write_lock "$test_version" "$checksum"
	rm -rf -- "$cache_root"
}

# The BSD form `stat -f` means "filesystem status" to GNU coreutils, which writes
# a block of filesystem detail to stdout before failing on the format operand, so
# a `stat -f ... || stat -c ...` fallback chain captures that detail alongside the
# real value and retention then ranks releases by prose instead of by time. The
# fault is invisible on macOS, where the BSD form simply succeeds.
#
# So the platform is simulated rather than assumed: retention runs twice, once
# against a stat presenting the BSD interface and once against one presenting
# the GNU interface, on whichever host this is. Both must reclaim exactly the
# same set. A fallback chain, a call site that skipped the platform branch, or a
# read spelled in a command substitution all make one of the two runs read a
# timestamp it cannot parse, and an unreadable timestamp is never ranked -- so
# the idle releases that should have been reclaimed survive, and the run fails.
run_release_ranking_reads_real_timestamps() {
	for simulated_stat in bsd gnu; do
		case "$simulated_stat" in
		bsd)
			simulated_uname=Darwin
			simulated_system=apple-darwin
			;;
		*)
			simulated_uname=Linux
			simulated_system=unknown-linux-gnu
			;;
		esac
		simulated_platform="$host_architecture-$simulated_system"
		ranking_version=v9.3.9
		rm -rf -- "$cache_root" "$curl_count"
		install_peer_consumer "ranking-$simulated_stat" "$ranking_version"
		idle_stamp=1
		for idle_release in v8.1.1 v8.1.2 v8.1.3 v8.1.4 v8.1.5; do
			mkdir -p "$cache_root/$idle_release"
			touch -t "20000${idle_stamp}010000" "$cache_root/$idle_release"
			idle_stamp=$((idle_stamp + 1))
		done

		observed=$(PATH="$temporary_root/stat-bin:$test_path" RHINO_INSTALL_CACHE="$cache_root" \
			RHINO_TEST_ARCHIVE="$temporary_root/release.tar.gz" RHINO_TEST_CURL_COUNT="$curl_count" \
			RHINO_TEST_UNAME_S="$simulated_uname" RHINO_TEST_STAT_EMULATE="$simulated_stat" \
			RHINO_TEST_IDENTITY="{\"schemaVersion\":1,\"version\":\"$ranking_version\",\"commit\":\"$test_commit\"}" \
			"$temporary_root/peers/ranking-$simulated_stat/rhino" probe)
		[ "$observed" = probe-ok ]
		[ -x "$cache_root/$ranking_version/$simulated_platform/rhino" ]
		[ -d "$cache_root/v8.1.5" ]
		[ -d "$cache_root/v8.1.4" ]
		[ ! -d "$cache_root/v8.1.3" ]
		[ ! -d "$cache_root/v8.1.2" ]
		[ ! -d "$cache_root/v8.1.1" ]
	done
	write_lock "$test_version" "$checksum"
	rm -rf -- "$cache_root" "$curl_count"
}

# Both wrappers install into one machine-wide cache under one user account. If
# either reached a path the other owns, one tool's retention pass would reclaim
# the other tool's release, and the failure would surface as a checksum mismatch
# in whichever repository ran second.
#
# Proved by observation rather than by reading the source for tool names: each
# wrapper runs under one identical machine environment -- same home, same cache
# home, same temporary directory -- with transport replaced by a recorder that
# fails. Every wrapper resolves its lock, cache root, install guard, release
# directory, and asset URL before that failure, so what each one actually
# touched can be compared. Nothing here reaches the network, and neither
# wrapper's real cache is involved.
run_bootstraps_never_share_state() {
	rhino_wrapper="$repository_root/rhino"
	hippo_wrapper="$repository_root/hippo"
	[ -x "$rhino_wrapper" ]
	[ -x "$hippo_wrapper" ]

	shared="$temporary_root/shared-machine"
	rm -rf -- "$shared"
	mkdir -p "$shared/bin" "$shared/checkouts/rhino" "$shared/checkouts/hippo"

	cat >"$shared/bin/curl" <<'OBSERVEEOF'
#!/bin/sh
for argument in "$@"; do
	case "$argument" in
	https://*) printf '%s\n' "$argument" >>"$RHINO_TEST_OBSERVED_URL" ;;
	esac
done
exit 99
OBSERVEEOF
	chmod 755 "$shared/bin/curl"

	cp "$rhino_wrapper" "$shared/checkouts/rhino/rhino"
	cp "$repository_root/rhino.lock" "$shared/checkouts/rhino/rhino.lock"
	cp "$hippo_wrapper" "$shared/checkouts/hippo/hippo"
	cp "$repository_root/hippo.lock" "$shared/checkouts/hippo/hippo.lock"
	chmod 755 "$shared/checkouts/rhino/rhino" "$shared/checkouts/hippo/hippo"

	observe_bootstrap() {
		observed_tool=$1
		shift
		rm -rf -- "${shared:?}/home" "${shared:?}/cache" "${shared:?}/tmp"
		mkdir -p "$shared/home" "$shared/cache" "$shared/tmp"
		: >"$temporary_root/observed-url-$observed_tool"
		set +e
		# A cleared environment, so a variable this suite happens to export can
		# never be what sends a wrapper somewhere.
		env -i PATH="$shared/bin:/usr/bin:/bin:/usr/sbin:/sbin" \
			HOME="$shared/home" XDG_CACHE_HOME="$shared/cache" TMPDIR="$shared/tmp" \
			RHINO_TEST_OBSERVED_URL="$temporary_root/observed-url-$observed_tool" \
			"$@" "$shared/checkouts/$observed_tool/$observed_tool" version >/dev/null 2>&1
		set -e
		find "$shared/home" "$shared/cache" "$shared/tmp" -mindepth 1 |
			sed "s|^$shared/||" | LC_ALL=C sort >"$temporary_root/footprint-$observed_tool"
	}

	observe_bootstrap rhino
	rhino_guard=$(find "$shared" -name '.install-guard.lock' -print -quit)
	rhino_root=$(dirname -- "$(find "$shared" -type d -name 'v[0-9]*.[0-9]*.[0-9]*' -print -quit)")
	observe_bootstrap hippo
	hippo_guard=$(find "$shared" -name '.install-guard.lock' -print -quit)
	hippo_root=$(dirname -- "$(find "$shared" -type d -name 'v[0-9]*.[0-9]*.[0-9]*' -print -quit)")

	[ -s "$temporary_root/footprint-rhino" ]
	[ -s "$temporary_root/footprint-hippo" ]
	[ -n "$rhino_guard" ]
	[ -n "$hippo_guard" ]

	# The cache root is where the release directory landed, not wherever the
	# guard happens to be -- and each guard has to sit in the root it serializes.
	# A guard resolved somewhere else, a shared temporary directory say, would
	# leave one tool's retention pass free to run over its own cache while
	# another consumer of that same cache holds a lock nobody is looking at.
	[ "$rhino_guard" = "$rhino_root/.install-guard.lock" ]
	[ "$hippo_guard" = "$hippo_root/.install-guard.lock" ]

	# No path either wrapper touched is a path the other touched.
	collisions=$(LC_ALL=C comm -12 "$temporary_root/footprint-rhino" "$temporary_root/footprint-hippo")
	if [ -n "$collisions" ]; then
		echo "the two bootstraps touch shared paths: $collisions" >&2
		return 1
	fi

	# And neither cache root lies inside the other, which path-set disjointness
	# alone would permit: a root containing the other's would put one tool's
	# retention pass in charge of the other tool's releases.
	case "$rhino_root/" in
	"$hippo_root/"*)
		echo "the RHINO cache root lies inside HIPPO's" >&2
		return 1
		;;
	esac
	case "$hippo_root/" in
	"$rhino_root/"*)
		echo "the HIPPO cache root lies inside RHINO's" >&2
		return 1
		;;
	esac

	# Each wrapper asked its own transport for its own asset, at the version its
	# own lock pins -- so lock, tool, and release URL agree tool by tool.
	rhino_url=$(sed -n '1p' "$temporary_root/observed-url-rhino")
	hippo_url=$(sed -n '1p' "$temporary_root/observed-url-hippo")
	rhino_pin=$(awk -F= '$1 == "version" { print $2 }' "$repository_root/rhino.lock")
	hippo_pin=$(awk -F= '$1 == "version" { print $2 }' "$repository_root/hippo.lock")
	case "$rhino_url" in
	*"/rhino/releases/download/$rhino_pin/rhino-"*) ;;
	*)
		echo "the RHINO bootstrap asked for $rhino_url" >&2
		return 1
		;;
	esac
	case "$hippo_url" in
	*"/hippo/releases/download/$hippo_pin/hippo_"*) ;;
	*)
		echo "the HIPPO bootstrap asked for $hippo_url" >&2
		return 1
		;;
	esac

	# Each wrapper honours its own cache-root override and is blind to the
	# other's. Both directions are asked, because they fail differently: a
	# wrapper that stopped reading its own variable would silently keep using
	# the default root, and one that fell back to its neighbour's would install
	# into a cache another tool's retention pass owns.
	for overriding_tool in rhino hippo; do
		case "$overriding_tool" in
		rhino) foreign_tool=hippo ;;
		*) foreign_tool=rhino ;;
		esac

		rm -rf -- "$shared/override-rhino" "$shared/override-hippo"
		observe_bootstrap "$overriding_tool" \
			RHINO_INSTALL_CACHE="$shared/override-rhino" \
			HIPPO_INSTALL_CACHE="$shared/override-hippo"
		[ -d "$shared/override-$overriding_tool" ]
		[ ! -e "$shared/override-$foreign_tool" ]
		# Nothing landed in the default root it was told not to use.
		[ ! -s "$temporary_root/footprint-$overriding_tool" ]

		rm -rf -- "$shared/override-rhino" "$shared/override-hippo"
		case "$overriding_tool" in
		rhino) observe_bootstrap rhino HIPPO_INSTALL_CACHE="$shared/override-hippo" ;;
		*) observe_bootstrap hippo RHINO_INSTALL_CACHE="$shared/override-rhino" ;;
		esac
		[ ! -e "$shared/override-$foreign_tool" ]
		# With only the neighbour's variable set it used its own default root.
		[ -s "$temporary_root/footprint-$overriding_tool" ]
	done

	# The test seams each adapter drives are part of its own subject's
	# environment surface, and a shared one would let one adapter's fixtures
	# steer the other adapter's wrapper. Assignment and expansion positions
	# only, and `_TEST_` only: this scenario drives HIPPO's *production*
	# cache-root override deliberately, just above.
	seam_use='\$\{?HIPPO_TEST_|HIPPO_TEST_[A-Z_]*='
	if grep -qE "$seam_use" "$repository_root/.github/scripts/test-rhino-bootstrap.sh"; then
		echo "the RHINO bootstrap suite drives a HIPPO test seam" >&2
		return 1
	fi
	seam_use='\$\{?RHINO_TEST_|RHINO_TEST_[A-Z_]*='
	if grep -qE "$seam_use" "$repository_root/.github/scripts/test-hippo-bootstrap.sh"; then
		echo "the HIPPO bootstrap suite drives a RHINO test seam" >&2
		return 1
	fi
}

while IFS= read -r scenario; do
	# Name each scenario as it starts: a failure under `set -e` is otherwise
	# silent, and a corpus that shrank would still end in a pass line.
	echo "  $scenario"
	case "$scenario" in
	'A cold cache installs once and a warm cache needs no transport') run_cold_then_warm_cache ;;
	"The caller's argument vector reaches the release unchanged") run_argument_vector_passthrough ;;
	'Tampered warm-cache payload never executes') run_tampered_warm_cache ;;
	'A downloaded archive whose digest misses the pin never executes') run_download_digest_mismatch ;;
	'Non-exact stable release version is rejected') run_non_exact_stable_version ;;
	'Exact candidate tag uses stable release identity') run_exact_candidate_tag_uses_stable_product_identity ;;
	'Release identity envelope must match exactly') run_non_exact_identity_envelope ;;
	'Unsupported platform is refused before any transport') run_unsupported_platform_refused ;;
	'Matching live install-lock owner remains protected') run_matching_live_owner ;;
	'Malformed identity for a live install-lock owner fails closed') run_malformed_live_owner ;;
	'Reused live PID with a different valid identity is reclaimed') run_reused_live_pid ;;
	'Dead install-lock owner is reclaimed') run_dead_owner ;;
	'Crash before install-lock metadata publication is recoverable') run_crash_before_publication ;;
	'Concurrent cold callers install from exactly one verified download') run_concurrent_cold_callers ;;
	'Concurrent stale reclaimers preserve a replacement live owner') run_concurrent_stale_reclaimers ;;
	'A consumer never removes an install lock it did not publish') run_never_removes_a_foreign_install_lock ;;
	'Install guard storage stays bounded across release versions') run_bounded_install_guard_storage ;;
	'Retention never deletes a release another consumer is using') run_retention_protects_installing_release ;;
	'Retention never evicts a release another repository still uses') run_retention_keeps_releases_other_repositories_use ;;
	'Release ranking reads real timestamps on every supported platform') run_release_ranking_reads_real_timestamps ;;
	'Retention reclaims releases left idle beyond its window') run_retention_reclaims_idle_releases ;;
	"The two consumer bootstraps never reach each other's state") run_bootstraps_never_share_state ;;
	*) exit 1 ;;
	esac
done <<EOF
$expected_scenarios
EOF

echo "rhino bootstrap tests passed"
