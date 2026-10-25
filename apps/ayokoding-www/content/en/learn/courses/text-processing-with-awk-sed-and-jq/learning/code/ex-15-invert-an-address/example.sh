#!/bin/bash
# => Worked Example 15: print everything the address does not match.
# => co-05: the ! after an address negates it: match the complement.
set -euo pipefail          # => strict mode: fail fast on errors and unset names
sed -n '2,3!p' planets.txt # => print every line except lines 2 and 3
# => the excluded middle stays out no matter how long the file grows.
