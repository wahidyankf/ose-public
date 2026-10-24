#!/bin/bash
# => Worked Example 10: trim and normalize with string built-ins.
# => co-04: gsub, tolower, and length are built-in awk functions.
set -euo pipefail                                                                                                # => strict mode: fail fast on errors and unset names
awk '{ clean = $0; gsub(/ /, "", clean); clean = tolower(clean); print clean " (" length(clean) ")" }' messy.txt # => strip spaces, fold case, count
# => gsub edits in place; tolower returns the folded copy; length counts it.
