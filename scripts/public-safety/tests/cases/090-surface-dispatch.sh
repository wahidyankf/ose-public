# shellcheck shell=bash
# The gate takes its surface from the environment and refuses to invent one.
# Every refusal here is exit 2: not screened is not the same as screened clean.
run() {
	local check="$PUBLIC_SAFETY_ROOT/scripts/public-safety/check.sh"
	local out rc

	out=$(env -u RHINO_GATE_SURFACE "$check" 2>&1)
	rc=$?
	assert_exit 2 "$rc" "exit code with no surface in the environment" || return 1
	assert_contains "RHINO_GATE_SURFACE" "$out" "diagnostic" || return 1

	out=$(RHINO_GATE_SURFACE='' "$check" 2>&1)
	rc=$?
	assert_exit 2 "$rc" "exit code with an empty surface" || return 1

	out=$(RHINO_GATE_SURFACE=telepathy "$check" 2>&1)
	rc=$?
	assert_exit 2 "$rc" "exit code with a surface outside the closed set" || return 1

	# The surface is real, but the payload the hook must supply is not there.
	out=$(RHINO_GATE_SURFACE=commit-msg "$check" 2>&1)
	rc=$?
	assert_exit 2 "$rc" "exit code for commit-msg with no message file" || return 1

	out=$(RHINO_GATE_SURFACE=commit-msg "$check" "$CASE_TMP/no-such-message" 2>&1)
	rc=$?
	assert_exit 2 "$rc" "exit code for commit-msg with an unreadable message file" || return 1
}
