# => Example 64: one format string aligns every row identically.
set -euo pipefail # => strict header first, as in every example
# => WHY printf: echo cannot align columns and varies per system.
printf "%-8s %s\n" "NAME" "STATE"  # => header row: 8-wide left field
printf "%-8s %s\n" "web-1" "ready" # => data row one, same widths
printf "%-8s %s\n" "db-1" "ready"  # => data row two, same widths
