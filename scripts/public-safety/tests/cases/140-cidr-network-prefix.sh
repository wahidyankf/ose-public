# shellcheck shell=bash
# A private-range CIDR network prefix names a range, not a machine, so the
# tracked shape set leaves it alone, while every form that names a host stays
# blocked: a prefix whose host bits are set, a network address written without a
# prefix length, an address with a port or a URL path, and an address followed
# by a slash that starts no prefix length.
#
# Networking lessons, container networks, cluster and cloud configuration, and
# SSRF block lists write ranges this way. Blocking them pushes authors to turn a
# correct range into a wrong one, and it hides no topology: the range reads the
# same on every network that uses it.
#
# Every value is assembled at run time, as in 080, so this file carries no text
# a screen could read as an address.
run() {
	local out rc
	local octet=$((RANDOM % 200 + 1))

	probe_blocks() {
		# probe_blocks <value>
		local value=$1
		printf 'notes referencing %s in passing\n' "$value" >"$CASE_TMP/probe.txt"
		out=$("$PREFLIGHT" --surface logs --file "$CASE_TMP/probe.txt" 2>&1)
		rc=$?
		assert_exit 1 "$rc" "exit code for a host form" || return 1
		assert_contains "internal-address" "$out" "diagnostic for a host form" || return 1
		assert_absent "$value" "$out" "diagnostic for a host form" || return 1
	}

	probe_blocks "10.$octet.0.$octet/24" || return 1
	probe_blocks "192.168.$octet.0" || return 1
	probe_blocks "172.$((RANDOM % 16 + 16)).$octet.$octet:8080" || return 1
	probe_blocks "http://100.$((RANDOM % 64 + 64)).$octet.$octet/health" || return 1
	probe_blocks "10.$octet.0.$octet/" || return 1

	{
		printf 'docker network create --subnet %s.%s.0.0/16 lab\n' 172 $((RANDOM % 16 + 16))
		printf 'block %s.0.0.0/8, %s.16.0.0/12, %s.168.0.0/16, and %s.64.0.0/10\n' 10 172 192 100
		printf 'podCIDR: "%s.%s.%s.0/24"\n' 10 "$octet" "$octet"
	} >"$CASE_TMP/ranges.txt"
	out=$("$PREFLIGHT" --surface logs --file "$CASE_TMP/ranges.txt" 2>&1)
	rc=$?
	assert_exit 0 "$rc" "exit code for CIDR network prefixes" || return 1
}
