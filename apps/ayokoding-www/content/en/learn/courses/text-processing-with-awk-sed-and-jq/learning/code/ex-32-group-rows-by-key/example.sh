#!/bin/bash
# => Worked Example 32: bucket objects with group_by.
# => co-12: group_by(.dc) gathers equal-key objects into sub-arrays.
# => the fixture arrives sorted by dc, which group_by requires.
set -euo pipefail             # => strict mode: fail fast on errors and unset names
jq 'group_by(.dc)' fleet.json # => collect hosts into one array per data center
# => unsorted input would split one dc into two groups: sort_by first then.
