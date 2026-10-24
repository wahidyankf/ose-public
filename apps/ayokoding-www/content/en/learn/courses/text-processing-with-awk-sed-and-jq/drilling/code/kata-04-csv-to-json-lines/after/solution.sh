#!/bin/bash
# => Kata 4 solution: jq reads raw lines and builds one object per row.
# => co-11: {sku, qty} constructs the object; tonumber keeps qty numeric.
# => co-09: -R feeds raw CSV lines in; select drops the header row.
set -euo pipefail                                                                             # => strict mode: fail fast on errors and unset names
jq -R -c 'split(",") | select(.[0] != "sku") | {sku: .[0], qty: (.[1] | tonumber)}' stock.csv # => one object per row
# => compact -c output keeps one object per line: JSON lines, ready to stream.
