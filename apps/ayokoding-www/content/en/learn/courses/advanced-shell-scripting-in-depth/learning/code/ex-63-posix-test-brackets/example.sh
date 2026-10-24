# shellcheck disable=SC2050 # rationale: constant comparisons demonstrate bracket operators, not variables
# => Example 63: single-bracket tests run on every POSIX shell.
set -euo pipefail # => strict header first, as in every example
# => WHY quoted operands: empties must not collapse the argument count.
if [ -f data.txt ]; then # => -f: the fixture is a regular file
	echo "file exists"      # => fixed confirmation for the file test
fi                       # => closes the existence test
if [ -s data.txt ]; then # => -s: the fixture is nonempty
	echo "file nonempty"    # => fixed confirmation for the size test
fi                       # => closes the size test
if [ "a" = "a" ]; then   # => =: string equality, quoted both sides
	echo "strings equal"    # => fixed confirmation for the string test
fi                       # => closes the string test
if [ 2 -gt 1 ]; then     # => -gt: integer comparison, never > inside brackets
	echo "numbers ordered"  # => fixed confirmation for the number test
fi                       # => closes the number test
