#!/usr/bin/env bash
# Tests for check-commit-message.sh. A conforming Conventional Commits message must pass, a non-conforming one must
# fail, and a run with no message must fail closed (the one exception is a pull-request range with no commits, which
# has nothing to lint). Both directions are asserted: a lint checked only on its failing
# cases would pass while rejecting everything, and at commit-msg that blocks every commit.
#
# The failing cases also assert the commitlint rule that rejected the message. Without that, a missing commitlint
# would fail the same way and pass the test for the wrong reason.
#
# The script runs the installed commitlint from the repository root, where commitlint.config.js and node_modules live.
# Commitlint reads its input and its config and writes nothing, so every run here is read-only and needs no network.
set -euo pipefail

here=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
root=$(CDPATH='' cd -- "$here/.." && pwd)
script="$here/check-commit-message.sh"
pass=0
fail=0

if [ -x "$script" ]; then
	pass=$((pass + 1))
else
	echo "FAIL: check-commit-message.sh is not committed as executable"
	fail=$((fail + 1))
fi

# expect LABEL WANT MESSAGE: WANT is "passes" or "fails". The message arrives through RHINO_GATE_MESSAGE, the variable
# the registry binds from the commit message, so the test exercises the same input path as the hook.
expect() {
	local label="$1" want="$2" message="$3" out code=0
	out=$(cd "$root" && RHINO_GATE_MESSAGE="$message" bash "$script" 2>&1) || code=$?
	if [ "$want" = "passes" ] && [ "$code" -ne 0 ]; then
		echo "FAIL: $label: expected exit 0, got $code: $out"
		fail=$((fail + 1))
		return
	fi
	if [ "$want" = "fails" ] && [ "$code" -eq 0 ]; then
		echo "FAIL: $label: expected a non-zero exit, got 0"
		fail=$((fail + 1))
		return
	fi
	pass=$((pass + 1))
}

# expect_rule LABEL MESSAGE RULE: the message must be rejected by the named commitlint rule.
expect_rule() {
	local label="$1" message="$2" rule="$3" out code=0
	out=$(cd "$root" && RHINO_GATE_MESSAGE="$message" bash "$script" 2>&1) || code=$?
	if [ "$code" -ne 0 ] && [[ "$out" == *"[$rule]"* ]]; then
		pass=$((pass + 1))
	else
		echo "FAIL: $label: expected rejection by [$rule], got exit $code: $out"
		fail=$((fail + 1))
	fi
}

expect "conforming message passes" passes "feat(gates): add the commit-message lint"
expect "conforming message with a scope and body passes" passes "fix(hooks): thin the commit-msg adapter

The hook dispatches its own surface only."
expect "non-conforming message fails" fails "bad message"
expect_rule "non-conforming message is rejected for its missing type" "bad message" "type-empty"
expect_rule "non-conforming message is rejected for its missing subject" "bad message" "subject-empty"

# A run with no message must stop, not lint an empty string that commitlint might accept. The surface variable is
# cleared so the check runs as an unscoped run, whatever the caller's environment.
missing_out=$(cd "$root" && env -u RHINO_GATE_MESSAGE -u RHINO_GATE_SURFACE bash "$script" 2>&1) && missing_code=0 || missing_code=$?
if [ "$missing_code" -ne 0 ] && [[ "$missing_out" == *"RHINO_GATE_MESSAGE is required"* ]]; then
	pass=$((pass + 1))
else
	echo "FAIL: a run with no message must stop naming RHINO_GATE_MESSAGE, got exit $missing_code: $missing_out"
	fail=$((fail + 1))
fi

# An empty message fails at commit-msg, where git would otherwise record it, and passes at pull-request, where an empty
# range is the only way to get one.
empty_commit_msg_out=$(cd "$root" && RHINO_GATE_MESSAGE='' RHINO_GATE_SURFACE=commit-msg bash "$script" 2>&1) && empty_commit_msg_code=0 || empty_commit_msg_code=$?
if [ "$empty_commit_msg_code" -ne 0 ]; then
	pass=$((pass + 1))
else
	echo "FAIL: an empty message at commit-msg must fail, got exit 0: $empty_commit_msg_out"
	fail=$((fail + 1))
fi
empty_range_out=$(cd "$root" && RHINO_GATE_MESSAGE='' RHINO_GATE_SURFACE=pull-request bash "$script" 2>&1) && empty_range_code=0 || empty_range_code=$?
if [ "$empty_range_code" -eq 0 ]; then
	pass=$((pass + 1))
else
	echo "FAIL: an empty pull-request range must pass, got exit $empty_range_code: $empty_range_out"
	fail=$((fail + 1))
fi

echo "passed=$pass failed=$fail"
[ "$fail" -eq 0 ]
