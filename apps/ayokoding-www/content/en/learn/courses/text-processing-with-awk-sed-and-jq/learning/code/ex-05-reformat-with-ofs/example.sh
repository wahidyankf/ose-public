#!/bin/bash
# => Worked Example 5: rebuild delimited rows with a new separator.
# => co-03: OFS is the separator awk puts between output fields.
# => co-01: assigning to $1 forces awk to rebuild the record with OFS.
set -euo pipefail                                    # => strict mode: fail fast on errors and unset names
awk 'BEGIN { OFS="," } { $1=$1; print }' metrics.txt # => rebuild each row comma-separated
# => $1=$1 touches a field, so awk rejoins all fields using OFS.
