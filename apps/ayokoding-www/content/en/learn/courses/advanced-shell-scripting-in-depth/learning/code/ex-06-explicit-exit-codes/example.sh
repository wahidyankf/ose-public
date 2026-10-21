# => Example 6: 0 means ok, 1 means failed, 2 means misused.
set -euo pipefail # => strict header first, as in every example
# => WHY toggle -e: capturing a nonzero status needs -e off for one block.
set +e # => allow the next probes to fail without aborting the demo
(exit 0)
echo "success exits: $?" # => probe 0: the happy-path code
(exit 1)
echo "failure exits: $?" # => probe 1: a runtime-failure code
(exit 2)
echo "misuse exits: $?" # => probe 2: a caller-misuse code
set -e                  # => strict again: the demo section is over
# => Real scripts exit with these codes instead of only printing them.
