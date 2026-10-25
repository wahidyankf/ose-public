#!/bin/bash
# => Kata 2 solution: the $ anchor confines the edit to a trailing version 1.
# => co-14: the second run finds no trailing "version 1", so output is stable.
# => co-06: the s command still does the replacing; the anchor guards it.
set -euo pipefail                             # => strict mode: fail fast on errors and unset names
sed -E 's/version 1$/version 2/' releases.txt # => upgrade exactly version 1, rerun-safe
# => "version 10" survives because 1 is not trailing there; "version 2" is done.
