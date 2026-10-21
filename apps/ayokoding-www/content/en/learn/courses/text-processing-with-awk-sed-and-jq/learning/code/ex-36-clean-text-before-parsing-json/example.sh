#!/bin/bash
# => Worked Example 36: strip log prefixes, then parse with jq.
# => co-16: sed returns each line to pure JSON; jq selects among objects.
set -euo pipefail                                                              # => strict mode: fail fast on errors and unset names
sed -E 's/^[^ ]+ \[[^]]+\] //' mixed.log | jq -r 'select(.ok == true) | .host' # => name the healthy hosts
# => the sed address of record is the prefix shape; everything after it is JSON.
