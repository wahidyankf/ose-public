#!/bin/bash
# => Worked Example 20: pair lines using the hold space.
# => co-08: h parks line one in hold space; H appends line two below it.
set -euo pipefail                   # => strict mode: fail fast on errors and unset names
sed -n 'h;n;H;g;s/\n/,/p' pairs.txt # => join every two lines with a comma
# => g pulls both lines back, the substitution merges them, p prints.
