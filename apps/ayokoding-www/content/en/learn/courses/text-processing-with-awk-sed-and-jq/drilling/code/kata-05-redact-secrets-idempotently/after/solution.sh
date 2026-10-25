#!/bin/bash
# => Kata 5 solution: match the key shape, not any single secret value.
# => co-14: rewriting REDACTED to REDACTED is a no-op, so reruns are safe.
# => co-06: one s command redacts every secret line in a single pass.
set -euo pipefail                                  # => strict mode: fail fast on errors and unset names
sed -E 's/^(token|key)=.*/\1=REDACTED/' config.txt # => redact by key name, not by value
# => user=adi survives: its key is outside the (token|key) group.
