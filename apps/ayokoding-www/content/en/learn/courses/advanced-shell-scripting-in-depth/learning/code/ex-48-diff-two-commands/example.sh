# => Example 48: <(...) turns each command output into a readable path.
set -euo pipefail # => strict header first, as in every example
# => WHY substitution: diff needs FILES, and these inputs are streams.
if diff <(printf "a\nb\n") <(printf "a\nc\n") >/dev/null; then # => compare the two generated streams
	echo "identical"                                              # => printed only when both commands agree
else                                                           # => diff exits 1 on any difference
	echo "differ"                                                 # => the two outputs disagree on line two
fi                                                             # => closes the comparison branch
