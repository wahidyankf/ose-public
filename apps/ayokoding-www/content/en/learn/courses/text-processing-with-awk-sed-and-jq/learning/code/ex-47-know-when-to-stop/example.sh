#!/bin/bash
# => Worked Example 47: whole-file awk aggregation and its limits.
# => co-15: the median needs every value at once, which strains the toolbox.
# => co-13: sorting forces whole-file memory; nothing here can stream.
set -euo pipefail                                                                                                                                                                                                                         # => strict mode: fail fast on errors and unset names
awk '{ v[NR] = $1 } END { n = NR; for (i = 1; i <= n; i++) for (j = i + 1; j <= n; j++) if (v[j] < v[i]) { t = v[i]; v[i] = v[j]; v[j] = t } if (n % 2 == 1) print v[(n + 1) / 2]; else print (v[n / 2] + v[n / 2 + 1]) / 2 }' values.txt # => median via a hand-rolled sort
# => this works, and the hand-rolled sort is exactly the smell: reach further here.
