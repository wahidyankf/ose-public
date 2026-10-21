#!/bin/bash
# => Worked Example 18: reorder columns with capture groups.
# => co-07: (first) and (second) capture words; \2 and \1 reuse them swapped.
# => co-06: the s command still does the replacing; groups decide the order.
set -euo pipefail                             # => strict mode: fail fast on errors and unset names
sed -E 's/([a-z]+) ([a-z]+)/\2 \1/' names.txt # => swap the two lowercase words per line
# => -E selects extended expressions, so groups are plain parentheses.
