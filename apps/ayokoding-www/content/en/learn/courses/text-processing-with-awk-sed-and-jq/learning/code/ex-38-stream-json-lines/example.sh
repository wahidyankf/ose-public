#!/bin/bash
# => Worked Example 38: process one object per line without slurping.
# => co-13: jq reads a stream of values; -s would load them all at once.
set -euo pipefail                          # => strict mode: fail fast on errors and unset names
echo "stream:"                             # => label the streaming pass, which holds one object at a time
jq -r '"\(.event): \(.user)"' events.jsonl # => format each object as it arrives
echo "slurp count:"                        # => label the whole-file pass, which loads everything first
jq -s 'length' events.jsonl                # => count the objects after loading the full array
# => same file, two memory profiles: stream for pipelines, slurp for totals.
