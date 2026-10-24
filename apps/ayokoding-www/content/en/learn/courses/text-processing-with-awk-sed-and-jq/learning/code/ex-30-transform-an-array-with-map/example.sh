#!/bin/bash
# => Worked Example 30: reshape every element with map.
# => co-12: map runs the filter on each element, collecting the results.
set -euo pipefail         # => strict mode: fail fast on errors and unset names
jq 'map(. * 2)' nums.json # => double every number, keeping the array shape
# => one array in, one array out: map never changes the element count.
