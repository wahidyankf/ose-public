# shellcheck shell=bash
# Typed commit messages are outbound text, never Git's local hook file path.
run() {
	local check out rc message blocked_message octet
	check="$PUBLIC_SAFETY_ROOT/scripts/public-safety/check-commit-message"
	message='docs: explain the public safety adapter'

	out=$(RHINO_GATE_SURFACE=commit-msg "$check" "$message" 2>&1)
	rc=$?
	assert_exit 0 "$rc" "exit code for a typed hook message" || return 1
	assert_contains 'commit: clean' "$out" "hook-message report" || return 1

	out=$(RHINO_GATE_SURFACE=pull-request "$check" "$message" 2>&1)
	rc=$?
	assert_exit 0 "$rc" "exit code for a typed pull-request message" || return 1
	assert_contains 'pull-request: clean' "$out" "pull-request report" || return 1

	# The adapter must preserve refusal as well as success. Construct the probe
	# at run time so the test source stays safe to commit under this same gate.
	octet=$((RANDOM % 200 + 1))
	blocked_message="docs: route through 10.$octet.0.$octet"
	out=$(RHINO_GATE_SURFACE=commit-msg "$check" "$blocked_message" 2>&1)
	rc=$?
	assert_exit 1 "$rc" "blocked exit code for a typed hook message" || return 1
	assert_contains 'internal-address' "$out" "blocked hook diagnostic" || return 1
	assert_absent "$blocked_message" "$out" "blocked hook diagnostic" || return 1

	out=$("$check" "$message" 2>&1)
	rc=$?
	assert_exit 2 "$rc" "exit code without a product surface marker" || return 1
	assert_contains 'RHINO_GATE_SURFACE' "$out" "refusal" || return 1
}
