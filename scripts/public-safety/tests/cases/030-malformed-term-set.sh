# shellcheck shell=bash
# Malformed blocks, and the diagnostic names the line number and nothing else.
run() {
	local terms out rc
	terms="$CASE_TMP/malformed-terms.txt"

	# Two fields where three are required.
	printf 'maintainer-path\tliteral\n' >"$terms"
	out=$("$PREFLIGHT" --surface commit --terms "$terms" --text "hello" 2>&1)
	rc=$?
	assert_exit 2 "$rc" "exit code for a short line" || return 1
	assert_contains "line 1" "$out" "diagnostic" || return 1

	# A class outside the closed set.
	printf 'not-a-real-class\tliteral\tvalue\n' >"$terms"
	out=$("$PREFLIGHT" --surface commit --terms "$terms" --text "hello" 2>&1)
	rc=$?
	assert_exit 2 "$rc" "exit code for an unknown class" || return 1

	# A kind outside the closed set.
	printf 'maintainer-path\tsomething-else\tvalue\n' >"$terms"
	out=$("$PREFLIGHT" --surface commit --terms "$terms" --text "hello" 2>&1)
	rc=$?
	assert_exit 2 "$rc" "exit code for an unknown kind" || return 1

	# A regex that does not compile.
	printf 'internal-hostname\tregex\t[unclosed\n' >"$terms"
	out=$("$PREFLIGHT" --surface commit --terms "$terms" --text "hello" 2>&1)
	rc=$?
	assert_exit 2 "$rc" "exit code for an uncompilable regex" || return 1

	# A term set carrying a credential is malformed, not merely unwise.
	printf 'maintainer-path\tliteral\tghp_%s\n' "0123456789abcdefghijklmnopqrstuvwxyzAB" >"$terms"
	out=$("$PREFLIGHT" --surface commit --terms "$terms" --text "hello" 2>&1)
	rc=$?
	assert_exit 2 "$rc" "exit code for a credential-shaped term" || return 1
}
