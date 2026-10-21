#!/bin/bash
# => Kata 3 solution: the second .[] walks each group's members too.
# => co-09: .groups[].members[] streams every member as one value.
# => co-10: -r unwraps each value to a raw line for the next shell tool.
set -euo pipefail                       # => strict mode: fail fast on errors and unset names
jq -r '.groups[].members[]' nested.json # => flatten two levels into member lines
# => one .[] per nesting level: groups, then members inside each group.
