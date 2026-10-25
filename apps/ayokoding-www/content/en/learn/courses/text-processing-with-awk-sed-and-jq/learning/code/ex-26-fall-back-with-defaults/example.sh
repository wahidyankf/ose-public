#!/bin/bash
# => Worked Example 26: survive missing fields with //.
# => co-09: .role // "unknown" emits the field, or the default when absent.
set -euo pipefail                                       # => strict mode: fail fast on errors and unset names
jq '.[] | "\(.name): \(.role // "unknown")"' users.json # => label every user, defaulting the missing role
# => // fires on null and on absent alike, so ragged objects format evenly.
