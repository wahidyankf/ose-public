#!/bin/bash
# => Worked Example 27: print shell-ready lines with -r.
# => co-09: the string filter builds the line; -r unwraps its JSON quotes.
# => co-10: the pipe carries each object into the formatting filter.
set -euo pipefail                                      # => strict mode: fail fast on errors and unset names
jq -r '.[] | "\(.name),\(.role // "none")"' users.json # => emit raw comma-separated lines
# => raw output drops the quotes, so downstream tools see plain columns.
