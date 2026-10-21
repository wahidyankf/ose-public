# => Example 75: EXPR:EXPECTED rows run through one shared loop.
set -euo pipefail # => strict header first, as in every example
# => WHY a table: adding a case appends an element, never a branch.
# => The colon split below forks nothing: pure parameter expansion.
cases=("1+1:2" "2*3:6" "10-4:6")   # => each case is EXPR:EXPECTED in one word
failures=0                         # => shared verdict counter for the whole table
for entry in "${cases[@]}"; do     # => quoted: one turn per table row
	expr="${entry%%:*}"               # => strip the longest :suffix: the expression half
	want="${entry#*:}"                # => strip the shortest prefix: the expected half
	got="$((expr))"                   # => arithmetic on the expression half, data never code
	if [ "${got}" = "${want}" ]; then # => compare computed against expected
		echo "ok: ${expr}"               # => the table row passed
	else                              # => computed differs
		echo "FAIL: ${expr}"             # => the table row failed
		failures=$((failures + 1))       # => count it toward the verdict
	fi                                # => closes the row verdict
done                               # => every table row ran exactly once
echo "failures: ${failures}"       # => 0: the whole table passed
