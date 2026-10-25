#!/bin/bash
# => Worked Example 6: keep rows matching a regular expression.
# => co-02: the /fail/ pattern tests each record; the action runs on matches.
set -euo pipefail                    # => strict mode: fail fast on errors and unset names
awk '/fail/ { print $1 }' scores.txt # => print the name field of failing rows only
# => rows without "fail" never reach the action; nothing prints for them.
