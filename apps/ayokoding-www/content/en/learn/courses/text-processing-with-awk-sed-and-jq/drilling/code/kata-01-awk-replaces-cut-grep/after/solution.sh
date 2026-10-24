#!/bin/bash
# => Kata 1 solution: one awk program selects and projects together.
# => co-01: -F: splits records; $2 == "engineer" tests the role exactly.
# => co-02: the pattern admits engineers; the action prints their names.
set -euo pipefail                                     # => strict mode: fail fast on errors and unset names
awk -F: '$2 == "engineer" { print $1 }' employees.txt # => one program, no pipe
# => exact equality beats grep here: "engineer" never matches "engineering".
