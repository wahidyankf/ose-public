# => Example 40: mapfile -t loads one array element per input line.
set -euo pipefail # => strict header first, as in every example
# => WHY mapfile: substitution capture would split and glob every line.
mapfile -t hosts <hosts.txt # => one element per fixture line, newlines stripped
echo "hosts: ${#hosts[@]}"  # => the count proves every line landed
for h in "${hosts[@]}"; do  # => quoted: each line stays one element
	echo "host: ${h}"          # => handle each host exactly once
done                        # => three turns for three fixture lines
