#!/bin/bash
# => Worked Example 13: print lines by pattern instead of number.
# => co-05: the /down/ address selects lines by content, not position.
set -euo pipefail             # => strict mode: fail fast on errors and unset names
sed -n '/down/p' services.txt # => print every line containing "down"
# => line numbers may shift between runs; the pattern still finds its lines.
