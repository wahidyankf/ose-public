# => Example 49: paste joins substitution streams line by line.
set -euo pipefail # => strict header first, as in every example
# => WHY paste plus substitution: two streams become one table, no files.
paste -d: <(printf "a\nb\n") <(printf "1\n2\n") # => join rows with colons
echo "joined two streams"                       # => fixed marker after the joined rows
