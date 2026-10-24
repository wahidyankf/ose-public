#!/bin/bash
# => Worked Example 1: print one column from colon-separated rows.
# => co-01: each line is a record, each colon chunk is a field.
set -euo pipefail                # => strict mode: fail fast on errors and unset names
awk -F: '{ print $2 }' users.txt # => split every record on colons, print field 2
# => $2 is the role column here; $1 would be the name, $3 the team.
