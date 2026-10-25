#!/bin/bash
# => Worked Example 17: substitute globally with the g flag.
# => co-06: the trailing g repeats the replacement for every match.
set -euo pipefail            # => strict mode: fail fast on errors and unset names
sed 's/hello/hi/g' greet.txt # => replace every hello on each line
# => compare with Example 16: the flag is the only difference.
