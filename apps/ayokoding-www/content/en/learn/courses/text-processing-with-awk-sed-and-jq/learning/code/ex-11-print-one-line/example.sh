#!/bin/bash
# => Worked Example 11: print a single line by number.
# => co-05: the 3 address selects only line 3; -n suppresses the rest.
set -euo pipefail       # => strict mode: fail fast on errors and unset names
sed -n '3p' planets.txt # => print only line 3, nothing else
# => -n turns off automatic printing; p prints the addressed line.
