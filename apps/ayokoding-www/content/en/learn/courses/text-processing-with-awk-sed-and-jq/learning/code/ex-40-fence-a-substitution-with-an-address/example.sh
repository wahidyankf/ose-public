#!/bin/bash
# => Worked Example 40: confine edits to addressed lines.
# => co-14: the range address fences the substitution; lines outside keep host=.
# => co-05: /# web/,/# db/ selects exactly the web-tier block.
set -euo pipefail                                 # => strict mode: fail fast on errors and unset names
sed -E '/# web/,/# db/s/host=/node=/' servers.txt # => rename host= only inside the web block
# => the db line keeps host= because it sits outside the addressed range.
