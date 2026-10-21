#!/bin/bash
# => Worked Example 19: reshape dates with back-references.
# => co-07: three groups capture year, month, day; \3/\2/\1 reorders them.
set -euo pipefail                                                 # => strict mode: fail fast on errors and unset names
sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/\3\/\2\/\1/' dates.txt # => rewrite each ISO date as day/month/year
# => \/ is an escaped separator inside the replacement; groups do the moving.
