#!/bin/bash
# => Worked Example 3: stream line numbers without loading the file.
# => co-03: NR is the current record number, maintained by awk itself.
# => co-13: awk reads one record at a time, so this streams.
set -euo pipefail                             # => strict mode: fail fast on errors and unset names
awk '{ printf "%d: %s\n", NR, $0 }' hosts.txt # => prefix every line with its number
# => $0 is the whole record; printf formats the number and the line.
