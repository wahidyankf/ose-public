# => Example 72: one helper, one counter, one verdict per suite.
set -euo pipefail # => strict header first, as in every example
# => WHY a helper: one-line calls scale, copy-pasted branches do not.
# => The counter below stays zero only when every assertion passes.
failures=0                                                                 # => shared verdict counter for the whole suite
assert_eq() {                                                              # => compare two values, name the check, count misses
	if [ "$1" = "$2" ]; then                                                  # => string equality on the two operands
		echo "ok: $3"                                                            # => $3 names the passing check
	else                                                                      # => values differ
		echo "FAIL: $3 (got [$1])"                                               # => show the actual value for debugging
		failures=$((failures + 1))                                               # => count the failure for the final verdict
	fi                                                                        # => closes the equality branch
}                                                                          # => closes the shared assertion helper
assert_eq "2" "$(printf "a\nb\n" | wc -l | tr -d " ")" "two lines counted" # => real check one
assert_eq "apple" "apple" "literal matches"                                # => real check two
echo "failures: ${failures}"                                               # => 0: every assertion passed
