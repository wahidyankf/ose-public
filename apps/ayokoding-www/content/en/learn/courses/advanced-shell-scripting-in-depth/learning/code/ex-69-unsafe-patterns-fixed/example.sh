# => Example 69: guard removals with :? and compute with $(()), never eval.
set -euo pipefail # => strict header first, as in every example
# => WHY these guards: unguarded rm and eval are the two data killers.
dir="build/out"        # => the directory this demo manages
rm -rf "${dir:?}/"     # => :? aborts when empty: never rm -rf / by typo
echo "cleaned: ${dir}" # => fixed confirmation names the cleaned dir
expr="2 + 3"           # => arithmetic as DATA, never evaluated as code
echo "sum: $((expr))"  # => $(()) computes math without executing commands
