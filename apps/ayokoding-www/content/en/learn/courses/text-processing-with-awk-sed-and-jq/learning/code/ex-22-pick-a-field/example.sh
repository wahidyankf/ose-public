#!/bin/bash
# => Worked Example 22: read one value out of an object.
# => co-09: .host is a filter selecting the host field, nothing else.
set -euo pipefail      # => strict mode: fail fast on errors and unset names
jq '.host' server.json # => print the host value, quoted as JSON
# => every filter takes JSON in and emits JSON out, even a single string.
