#!/bin/bash
# => Worked Example 42: fill missing JSON fields idempotently.
# => co-14: //= writes the default only when the field is missing or null.
# => co-09: the filter selects each role field, defaulting exactly one gap.
set -euo pipefail                                                                # => strict mode: fail fast on errors and unset names
first=$(jq -c '.[] | (.role //= "unknown")' users.json)                          # => first pass: default the missing role
second=$(printf '%s\n' "$first" | jq -c '.role //= "unknown"')                   # => second pass over the result
printf '%s\n' "$first"                                                           # => the defaulted objects, printed once
if [ "$first" = "$second" ]; then echo "stable: yes"; else echo "stable: no"; fi # => rerun proof
# => existing values survive both passes; only the gap was ever filled.
