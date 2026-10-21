#!/bin/bash
# => Worked Example 33: order rows and drop repeats.
# => co-12: unique sorts the values and emits each distinct one once.
# => co-10: the pipe sorts explicitly first, so the intent reads twice.
set -euo pipefail            # => strict mode: fail fast on errors and unset names
jq 'sort | unique' tags.json # => sort the tags, then keep one of each
# => unique alone would sort too; naming sort states the contract up front.
