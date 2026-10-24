# => Example 36: quoted @ gives one loop turn per element.
set -euo pipefail # => strict header first, as in every example
# => WHY quoted @: unquoted iteration resplits elements with spaces.
servers=("web-1" "web-2" "db-1") # => three elements to visit
for s in "${servers[@]}"; do     # => quoted: one turn per element, intact
	echo "server: ${s}"             # => handle each element exactly once
done                             # => three turns, one per element
