#!/bin/bash
# => Worked Example 37: filter lines fast, then reformat.
# => co-16: grep narrows by content; awk shapes the survivors into columns.
set -euo pipefail                                   # => strict mode: fail fast on errors and unset names
grep 'POST' access.log | awk '{ print $2 ": " $3 }' # => show path and status of POST requests
# => grep exits 0 because POST lines exist; awk never sees the GET noise.
