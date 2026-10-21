#!/bin/bash
# => Worked Example 31: fold an array into one number.
# => co-12: reduce walks the stream carrying an accumulator, starting at 0.
set -euo pipefail                            # => strict mode: fail fast on errors and unset names
jq 'reduce .[] as $x (0; . + $x)' sales.json # => add every element into one total
# => $x is the current element, . is the running total: same shape as awk's sum.
