# => Kata 7 starter: blind creation fails on the second run.
# => Rerunning crashes instead of converging: not idempotent.
set -euo pipefail # => strict header first, as in every script
echo "created"    # => claims creation without checking state first
