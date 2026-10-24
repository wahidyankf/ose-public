#!/bin/bash
# => Worked Example 44: columnar math stays in awk.
# => co-15: fields plus arithmetic is awk's home ground, not sed's.
# => co-01: $3 selects the total column that the average needs.
set -euo pipefail                                                    # => strict mode: fail fast on errors and unset names
awk -F, 'NR > 1 { sum += $3; n++ } END { print sum / n }' orders.csv # => average the total column
# => sed could delete commas but cannot divide; awk fields and divides.
