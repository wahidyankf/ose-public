#!/bin/bash
# => Worked Example 7: keep rows between two patterns.
# => co-02: a two-pattern range turns the action on at BEGIN, off after END.
set -euo pipefail              # => strict mode: fail fast on errors and unset names
awk '/BEGIN/,/END/' report.txt # => print every record from the BEGIN line to the END line
# => lines before BEGIN and after END never match, so they never print.
