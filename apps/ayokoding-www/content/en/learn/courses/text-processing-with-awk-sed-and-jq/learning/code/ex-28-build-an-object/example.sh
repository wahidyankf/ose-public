#!/bin/bash
# => Worked Example 28: assemble a new object from parts.
# => co-11: {name, team} builds an object keeping only the named fields.
set -euo pipefail           # => strict mode: fail fast on errors and unset names
jq '{name, team}' user.json # => project the user down to two fields
# => shorthand {name} means {name: .name}: same value, new shape.
