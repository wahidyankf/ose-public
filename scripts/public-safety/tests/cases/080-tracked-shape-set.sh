# shellcheck shell=bash
# The tracked shape set must actually match the shapes it claims to. A term
# file that matches nothing passes everything, and it looks identical to a
# working one from the outside.
#
# Every probe value is assembled at run time from fragments, so no string that
# this repository's own gate would flag exists anywhere in this file. A test
# that hardcoded `<private-address>` would block the very commit that adds it.
#
# The fragments are chosen so that the *source* text cannot match either: the
# arithmetic form `box$((n)).local` leaves `)` where the hostname shape needs a
# letter or a digit, while still producing a real hostname at run time. The
# first draft used `box-$n.local`, and the gate blocked its own test file --
# which is the behaviour working, not failing.
run() {
	local out rc probe
	local user="synthetic-user-$RANDOM"
	local octet=$((RANDOM % 200 + 1))

	probe_blocks() {
		# probe_blocks <expected-class> <value>
		local want=$1 value=$2
		printf 'notes referencing %s in passing\n' "$value" >"$CASE_TMP/probe.txt"
		out=$("$PREFLIGHT" --surface logs --file "$CASE_TMP/probe.txt" 2>&1)
		rc=$?
		assert_exit 1 "$rc" "exit code for a $want shape" || return 1
		assert_contains "$want" "$out" "diagnostic for a $want shape" || return 1
		assert_absent "$value" "$out" "diagnostic for a $want shape" || return 1
	}

	probe="/Users/$user/notes/"
	probe_blocks maintainer-path "$probe" || return 1

	probe="/home/$user/notes/"
	probe_blocks maintainer-path "$probe" || return 1

	probe="10.$octet.0.$octet"
	probe_blocks internal-address "$probe" || return 1

	probe="192.168.$octet.$octet"
	probe_blocks internal-address "$probe" || return 1

	probe="172.$((RANDOM % 16 + 16)).$octet.$octet"
	probe_blocks internal-address "$probe" || return 1

	probe="100.$((RANDOM % 64 + 64)).$octet.$octet"
	probe_blocks internal-address "$probe" || return 1

	probe="box$((octet)).local"
	probe_blocks internal-hostname "$probe" || return 1

	probe="box$((octet)).internal"
	probe_blocks internal-hostname "$probe" || return 1

	# A machine addressed through more than one label is still a machine on
	# someone's LAN, and publishing the deeper name publishes the same topology
	# as publishing the flat one. This probe is what stops an anchor from being
	# bought by narrowing the shape until only the flattest name is caught.
	probe="box$((octet)).rack$((octet)).internal"
	probe_blocks internal-hostname "$probe" || return 1

	# The shapes must also leave ordinary text alone. A screen that blocks
	# everything is as useless as one that blocks nothing, and it is the one
	# people learn to work around.
	{
		printf 'The documented form is a repository-relative path such as scripts/run.sh.\n'
		printf 'A public address is ordinary content, and so is a version: 9.8.7.6, v9.8.7.\n'
		printf 'A placeholder reads <private-host> or <repository-path>, never a real value.\n'
		# A dotted filename is not a hostname. `.env.local` is the name of a
		# file in the working tree of most projects that have one, and a
		# hostname shape that matches it turns an ordinary sentence about
		# configuration into a blocked commit. The literal is written out
		# rather than assembled because it is the one probe whose whole point
		# is that this repository's own gate does not flag it: if the shape
		# ever loses its anchor again, the gate blocks this file, and the
		# blocked file is the report.
		printf 'Local overrides live in .env.local, which the ignore list already covers.\n'
	} >"$CASE_TMP/ordinary.txt"
	out=$("$PREFLIGHT" --surface logs --file "$CASE_TMP/ordinary.txt" 2>&1)
	rc=$?
	assert_exit 0 "$rc" "exit code for ordinary content under the tracked shape set" || return 1
}
