#!/bin/bash
# => Worked Example 14: drop header and comment lines safely.
# => co-05: the /^#/ address selects every line starting with a hash.
# => co-14: sed prints to stdout here; config.txt on disk is untouched.
set -euo pipefail      # => strict mode: fail fast on errors and unset names
sed '/^#/d' config.txt # => delete comment lines, print everything else
# => no -i flag means the file is read, never rewritten: safe to rerun.
