# shellcheck disable=SC2034 # rationale: loops count split pieces; the variable is intentionally never expanded
# => Example 21: IFS decides where unquoted values split into words.
set -euo pipefail # => strict header first, as in every example
value="a:b:c"     # => one colon-separated value, like a PATH entry
# => Default IFS: colons do not split, so the value stays one word.
count=0                             # => piece counter reused for both demonstrations
for piece in ${value}; do           # => DELIBERATELY unquoted: default splitting
	count=$((count + 1))               # => count each piece the split produced
done                                # => one iteration: colons are not default separators
echo "default-ifs pieces: ${count}" # => 1: no split happened
# => Scoped IFS=: splits the same value into three, then auto-restores.
count=0                           # => reset the counter for the second demonstration
IFS=:                             # => assign IFS on its own line so read below sees colons
for piece in ${value}; do         # => DELIBERATELY unquoted: colon splitting
	count=$((count + 1))             # => count each colon-separated piece
done                              # => three iterations: a, b, and c
echo "colon-ifs pieces: ${count}" # => 3: the value split on colons
unset IFS                         # => restore the default separators explicitly
