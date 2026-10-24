#!/bin/bash
# => Worked Example 12: print a slice of numbered lines.
# => co-05: the 2,4 address selects lines 2 through 4, inclusive.
set -euo pipefail         # => strict mode: fail fast on errors and unset names
sed -n '2,4p' planets.txt # => print lines 2, 3, and 4; skip lines 1 and 5
# => both ends of a line range are inclusive in sed.
