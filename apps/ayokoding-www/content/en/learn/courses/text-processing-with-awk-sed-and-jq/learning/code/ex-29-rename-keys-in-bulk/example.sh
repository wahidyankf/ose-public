#!/bin/bash
# => Worked Example 29: remap keys across every object.
# => co-11: {first: .fn} renames a key while copying its value over.
set -euo pipefail                           # => strict mode: fail fast on errors and unset names
jq 'map({first: .fn, last: .ln})' rows.json # => rename fn/ln to first/last everywhere
# => the value expressions run per object; the new keys are literal names.
