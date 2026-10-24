# => Example 9: $1 $2 $# $@ name the script's positional operands.
set -euo pipefail # => strict header first, as in every example
# => WHY set -- here: demos install fixed argv so output never varies.
set -- alpha beta # => demo argv: two operands, no caller needed
echo "first: $1"  # => $1 is the first positional parameter
echo "second: $2" # => $2 is the second positional parameter
echo "count: $#"  # => $# counts the positional parameters
echo "all: $*"    # => $* joins every positional for display
