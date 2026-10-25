#!/bin/bash
# => Worked Example 39: anchor patterns so reruns change nothing.
# => co-14: v1$ matches only a trailing v1, so v10 and v2 never match.
set -euo pipefail                                                                # => strict mode: fail fast on errors and unset names
first=$(sed -E 's/v1$/v2/' deps.txt)                                             # => first pass: v1 becomes v2, v10 untouched
second=$(printf '%s\n' "$first" | sed -E 's/v1$/v2/')                            # => second pass over the result
printf '%s\n' "$first"                                                           # => the edited text, printed once
if [ "$first" = "$second" ]; then echo "stable: yes"; else echo "stable: no"; fi # => rerun proof
# => command substitution carries text between passes; no file is rewritten.
