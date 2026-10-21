# => Example 77: probe the 2-0-1 contract: misuse, success, failure.
set -euo pipefail # => strict header first, as in every example
# => WHY relaxed -e: contract probes must fail without aborting the suite.
check() {                       # => the unit under test: validates one operand, exits by contract
	if [ -z "${1-}" ]; then        # => no operand provided
		echo "usage: check THING" >&2 # => usage belongs on stderr, always
		return 2                      # => misuse: the caller forgot the operand
	fi                             # => closes the misuse guard
	if [ "$1" = "ok" ]; then       # => the one good value
		return 0                      # => success path
	fi                             # => closes the success branch
	return 1                       # => anything else is a runtime failure
}                               # => closes the unit under test
set +e                          # => the probes below must fail without aborting the suite
check
echo "missing exits: $?" # => 2: misuse, per the contract
check ok
echo "good exits: $?" # => 0: success
check bad
echo "bad exits: $?"  # => 1: runtime failure
set -e                # => strict again after the probes
echo "contract holds" # => fixed marker: 2, 0, 1 in order
