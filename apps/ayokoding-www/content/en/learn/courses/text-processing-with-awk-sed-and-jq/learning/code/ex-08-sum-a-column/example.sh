#!/bin/bash
# => Worked Example 8: aggregate in END after the stream ends.
# => co-02: END is a pattern that matches once, after the last record.
# => co-03: total accumulates field 2 across every record.
set -euo pipefail                                   # => strict mode: fail fast on errors and unset names
awk '{ total += $2 } END { print total }' sales.txt # => add each amount, print the sum once
# => no per-record action prints; the single END action prints the total.
