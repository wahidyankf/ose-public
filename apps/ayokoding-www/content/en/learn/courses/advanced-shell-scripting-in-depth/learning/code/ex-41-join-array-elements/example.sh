# => Example 41: star joins with the first IFS char; scope IFS tightly.
set -euo pipefail # => strict header first, as in every example
# => WHY scoped IFS: the join char must not leak into later splits.
parts=("usr" "local" "bin") # => path components as array elements
IFS=/                       # => join character for the next expansion only
joined="${parts[*]}"        # => star joins with the first IFS char
unset IFS                   # => restore the default separators immediately
echo "path: /${joined}"     # => absolute path built from components
