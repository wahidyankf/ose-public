# => Example 78: strict flags, trap verdict, asserts, all green.
set -euo pipefail # => strict header first, as in every example
# => WHY one script: the course patterns must compose without interference.
# => The EXIT trap prints the tally even when a middle check fails.
passed=0                                                         # => green-check counter for the final verdict
check() {                                                        # => assert equality and count the green checks
	if [ "$1" = "$2" ]; then                                        # => values agree
		echo "ok: $3"                                                  # => $3 names the passing check
		passed=$((passed + 1))                                         # => count it toward the verdict
	else                                                            # => values differ
		echo "FAIL: $3"                                                # => a red check the suite would report
	fi                                                              # => closes the equality branch
}                                                                # => closes the shared assertion helper
verdict() {                                                      # => the EXIT handler: print the tally last
	echo "suite: ${passed}/5"                                       # => the verdict: five green or short of it
}                                                                # => closes the verdict printer
trap verdict EXIT                                                # => the verdict prints on every exit path
check "strict" "strict" "flags on"                               # => check one: literal equality
check "2" "$(printf "a\nb\n" | wc -l | tr -d " ")" "pipe counts" # => check two: trimmed pipe count
check "a:b" "a:b" "colons kept"                                  # => check three: separators survive
check "3" "3" "counts agree"                                     # => check four: numeric strings match
check "done" "done" "suite ends"                                 # => check five: the closing literal
