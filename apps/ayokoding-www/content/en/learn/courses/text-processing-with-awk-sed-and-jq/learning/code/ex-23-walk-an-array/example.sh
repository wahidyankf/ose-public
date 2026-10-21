#!/bin/bash
# => Worked Example 23: iterate array elements with .[].
# => co-09: .[] explodes one array into a stream of its elements.
set -euo pipefail   # => strict mode: fail fast on errors and unset names
jq '.[]' hosts.json # => emit each array element as its own JSON value
# => three elements in, three values out, in the same order.
