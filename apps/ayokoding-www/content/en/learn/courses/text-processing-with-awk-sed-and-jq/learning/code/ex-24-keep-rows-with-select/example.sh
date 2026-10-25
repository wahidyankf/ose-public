#!/bin/bash
# => Worked Example 24: filter objects with select.
# => co-09: select(.up == true) keeps the object or drops it entirely.
# => co-10: the pipe feeds each object from .[] into select, then .name.
set -euo pipefail                                    # => strict mode: fail fast on errors and unset names
jq '.[] | select(.up == true) | .name' services.json # => name every service that is up
# => select emits its input unchanged or nothing at all: a true filter.
