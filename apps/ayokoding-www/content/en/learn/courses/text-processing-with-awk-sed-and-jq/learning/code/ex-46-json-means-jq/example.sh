#!/bin/bash
# => Worked Example 46: nested structure stays in jq.
# => co-15: navigating objects-inside-objects is jq's home ground, not grep's.
# => co-09: .store.books[].price walks two levels down to every price.
set -euo pipefail                           # => strict mode: fail fast on errors and unset names
jq '[.store.books[].price] | add' deep.json # => sum every book price in the store
# => grep sees the word price but cannot pair it with its number safely.
