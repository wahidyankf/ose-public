#!/bin/bash
# => Worked Example 45: line surgery stays in sed.
# => co-15: deleting addressed lines is sed's home ground, not awk's.
# => co-05: the /REMOVE/ address selects exactly the lines to drop.
set -euo pipefail         # => strict mode: fail fast on errors and unset names
sed '/REMOVE/d' notes.txt # => delete every line containing REMOVE
# => awk could test the same pattern, but d states the intent directly.
