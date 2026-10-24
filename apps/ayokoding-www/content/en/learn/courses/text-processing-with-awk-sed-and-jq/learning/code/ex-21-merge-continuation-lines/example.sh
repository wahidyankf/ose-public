#!/bin/bash
# => Worked Example 21: join wrapped lines with N.
# => co-08: N appends the next line, so one substitution sees both halves.
set -euo pipefail                                                # => strict mode: fail fast on errors and unset names
sed -e ':join' -e '/\\$/N' -e 's/\\\n//' -e 't join' wrapped.txt # => merge backslash-continued lines
# => the loop repeats while a line ends with a backslash, then prints whole.
