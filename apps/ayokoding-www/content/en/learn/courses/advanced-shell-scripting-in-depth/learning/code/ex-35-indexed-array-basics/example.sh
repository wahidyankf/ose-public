# => Example 35: parentheses build the array, brackets read it.
set -euo pipefail # => strict header first, as in every example
# => WHY one array: server1/server2/server3 variables never scale.
servers=("web-1" "web-2" "db-1") # => three elements, indexes 0 to 2
echo "first: ${servers[0]}"      # => index 0 is the first element
echo "count: ${#servers[@]}"     # => ${#arr[@]} counts the elements
echo "all: ${servers[*]}"        # => * joins elements for display
