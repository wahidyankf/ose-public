# => Example 43: a seen-map dedupes in one pass, keeping first-sight order.
set -euo pipefail # => strict header first, as in every example
# => WHY a map: sorting dedupes but destroys the original order.
declare -A seen=()                   # => set of names already printed
while IFS= read -r name; do          # => read each fixture line exactly
	if [ -z "${seen[${name}]-}" ]; then # => empty means first sight
		seen["${name}"]=1                  # => remember it so later dupes are skipped
		echo "unique: ${name}"             # => print only the first occurrence
	fi                                  # => closes the first-sight branch
done <names.txt                      # => redirection keeps the map in this shell
