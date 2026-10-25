#!/bin/bash
# => Worked Example 43: print the diff-like preview, change nothing.
# => co-14: previewing first means the edit runs only after eyes approve it.
set -euo pipefail               # => strict mode: fail fast on errors and unset names
echo "original:"                # => label the untouched fixture below
cat draft.txt                   # => show the file exactly as it sits on disk
echo "proposed:"                # => label the edit that has not happened yet
sed 's/^TODO:/DONE:/' draft.txt # => show what the substitution would produce
# => stdout carries both views; the fixture file is never rewritten.
