# => Example 37: # counts elements, :offset:length slices them.
set -euo pipefail # => strict header first, as in every example
# => WHY slices: offsets beat manual index loops for heads and tails.
servers=("web-1" "web-2" "db-1" "db-2") # => four elements to measure
echo "count: ${#servers[@]}"            # => 4: the whole array measured at once
echo "middle: ${servers[*]:1:2}"        # => two elements starting at index 1
echo "last: ${servers[3]}"              # => explicit last index, portable everywhere
