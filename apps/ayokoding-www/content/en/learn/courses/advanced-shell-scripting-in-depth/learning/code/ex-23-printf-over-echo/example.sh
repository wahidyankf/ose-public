# => Example 23: printf with a format string behaves the same everywhere.
set -euo pipefail # => strict header first, as in every example
# => WHY printf: echo interprets -n and backslashes differently per system.
printf "%s\n" "-n"                         # => prints -n literally; echo would eat it as a flag
printf "%s\n" "100% done"                  # => data percent needs no doubling in %s args
printf "%s=%s\n" "key" "value with spaces" # => format once, data quoted
