# => Kata 5 starter: a fixed scratch path with no cleanup at all.
# => Reruns collide and crashed runs leak the directory behind.
set -euo pipefail             # => strict header first, as in every script
scratch="/tmp/kata05-scratch" # => FIXED path: collides between parallel runs
mkdir -p "${scratch}"         # => stale files from crashed runs survive here
echo "scratch: fixed path"    # => fixed label hides the collision risk
