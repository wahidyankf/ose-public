# => Example 5: || gives a strict script a planned fallback path.
set -euo pipefail # => strict header first, as in every example
# => WHY || instead of if: one line states try-this-then-that.
role=$(cat role.txt 2>/dev/null || echo "reader") # => file or default
# => 2> hides grep-style noise; the fallback keeps the script strict.
echo "role: ${role}" # => prints the file value or the default
