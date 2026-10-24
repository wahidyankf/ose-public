# => Kata 3 solution: the same output asserted against a golden file.
set -euo pipefail # => strict header first, as in every script
# => WHY golden files: committed snapshots decide, humans only review diffs.
actual="$(mktemp)"                           # => capture file under /tmp, never in the repo
cleanup() {                                  # => remove the capture on every exit path
	rm -f "${actual}"                           # => the capture file vanishes with the script
}                                            # => closes the capture cleaner
trap cleanup EXIT                            # => removal runs on success, error, or signal exits
printf "users: 3\n" >"${actual}"             # => the output under test, captured
if cmp -s "${actual}" after/golden.txt; then # => silent compare: status only
	echo "test passes"                          # => byte-identical to the committed snapshot
else                                         # => any byte differs
	echo "test fails"                           # => the golden file caught a behaviour change
	exit 1                                      # => red tests exit nonzero so suites notice
fi                                           # => closes the golden comparison
