#!/bin/bash
# => Worked Example 25: pass values left to right through |.
# => co-10: each pipe hands the previous filter's output to the next filter.
set -euo pipefail                                # => strict mode: fail fast on errors and unset names
jq '.[] | "\(.customer): \(.total)"' orders.json # => format every order as one string
# => string interpolation builds the line; the pipe delivers each order to it.
