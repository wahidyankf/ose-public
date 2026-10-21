#!/bin/bash
# => Worked Example 41: run an awk cleanup twice, prove stability.
# => co-14: rebuilding fields with OFS converges: the second run is a no-op.
set -euo pipefail                                                                # => strict mode: fail fast on errors and unset names
first=$(awk '{$1=$1; print}' messy.txt)                                          # => first pass: collapse every whitespace run
second=$(printf '%s\n' "$first" | awk '{$1=$1; print}')                          # => second pass over the result
printf '%s\n' "$first"                                                           # => the cleaned text, printed once
if [ "$first" = "$second" ]; then echo "stable: yes"; else echo "stable: no"; fi # => rerun proof
# => normalized text rebuilds to itself, so the cleanup is safe to repeat.
