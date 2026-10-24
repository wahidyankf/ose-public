#!/bin/bash
# => Worked Example 16: substitute once per line on purpose.
# => co-06: s/hello/hi/ without a flag replaces only the first match.
set -euo pipefail           # => strict mode: fail fast on errors and unset names
sed 's/hello/hi/' greet.txt # => replace the first hello on each line
# => later matches on the same line survive: first-only is the default.
