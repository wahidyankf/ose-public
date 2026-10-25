#!/bin/bash
# => Worked Example 4: spot ragged rows by field count.
# => co-03: NF is the field count of the current record only.
# => co-01: rows with fewer or more fields break column assumptions.
set -euo pipefail                     # => strict mode: fail fast on errors and unset names
awk '{ print NF ": " $0 }' ragged.txt # => print each row prefixed by its field count
# => the 2-field row stands out next to the 3-field and 5-field rows.
