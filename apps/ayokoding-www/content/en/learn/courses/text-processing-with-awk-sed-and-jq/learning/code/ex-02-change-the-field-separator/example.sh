#!/bin/bash
# => Worked Example 2: parse comma-separated values with -F.
# => co-01: CSV rows are records, comma chunks are fields.
# => co-03: NR counts records, so NR > 1 skips the header row.
set -euo pipefail                                # => strict mode: fail fast on errors and unset names
awk -F, 'NR > 1 { print $2 ": " $3 }' orders.csv # => skip header, print customer and total
# => -F, sets the field separator to a comma for this whole program.
