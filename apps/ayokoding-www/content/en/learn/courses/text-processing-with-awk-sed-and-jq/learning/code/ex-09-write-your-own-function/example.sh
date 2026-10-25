#!/bin/bash
# => Worked Example 9: factor repeated logic into an awk function.
# => co-04: function status(t) names the fever rule once, reused per row.
set -euo pipefail                                                                                            # => strict mode: fail fast on errors and unset names
awk 'function status(t) { if (t >= 38) return "fever"; return "ok" } { print $1 ": " status($2) }' temps.txt # => label every temperature
# => the function reads like the rulebook; the action stays one line.
