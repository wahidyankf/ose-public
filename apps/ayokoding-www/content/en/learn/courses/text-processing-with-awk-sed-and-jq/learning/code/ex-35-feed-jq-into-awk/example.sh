#!/bin/bash
# => Worked Example 35: flatten JSON to columns, then aggregate.
# => co-16: jq -r exits JSON into text; awk totals the numeric column.
set -euo pipefail                                                                                                        # => strict mode: fail fast on errors and unset names
jq -r '.[] | "\(.customer) \(.total)"' orders.json | awk '{ total += $2 } END { print "orders: " NR ", total: " total }' # => count orders and sum totals
# => NR counts the flattened rows; $2 carries each row's total into the sum.
