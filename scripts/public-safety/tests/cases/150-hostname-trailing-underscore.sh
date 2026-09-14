# shellcheck shell=bash
# An underscore continues an identifier, so a dotted API name whose member
# starts with a hostname suffix is not a hostname: a Terraform `local_file` data
# source, a socket's `local_addr`, or an object's `internal_state`. The leading
# boundary already refuses an underscore; the trailing one must too, or the
# shape blocks ordinary code while catching no machine.
#
# The hostname probes are assembled at run time, as in 080. The identifier lines
# are written out, because their whole point is that this repository's own gate
# does not flag them: if the trailing boundary is lost again, the gate blocks
# this file, and the blocked file is the report.
run() {
	local out rc value
	local octet=$((RANDOM % 200 + 1))

	for value in "box$((octet)).local" "box$((octet)).internal," "box$((octet)).lan:22" "box$((octet)).rack$((octet)).intranet/"; do
		printf 'ssh to %s for the deploy\n' "$value" >"$CASE_TMP/probe.txt"
		out=$("$PREFLIGHT" --surface logs --file "$CASE_TMP/probe.txt" 2>&1)
		rc=$?
		assert_exit 1 "$rc" "exit code for a hostname" || return 1
		assert_contains "internal-hostname" "$out" "diagnostic for a hostname" || return 1
		assert_absent "box$((octet))" "$out" "diagnostic for a hostname" || return 1
	done

	{
		printf 'content = data.local_file.config.content\n'
		printf 'let bound = listener.local_addr()?;\n'
		printf 'return self.internal_state\n'
	} >"$CASE_TMP/identifiers.txt"
	out=$("$PREFLIGHT" --surface logs --file "$CASE_TMP/identifiers.txt" 2>&1)
	rc=$?
	assert_exit 0 "$rc" "exit code for identifiers that continue past a suffix" || return 1
}
