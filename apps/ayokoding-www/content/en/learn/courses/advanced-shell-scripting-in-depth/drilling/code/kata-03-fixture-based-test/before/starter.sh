# => Kata 3 starter: eyeball verification, nothing asserted.
# => The output prints and a human decides whether it looks right.
set -euo pipefail            # => strict header first, as in every script
printf "users: 3\n"          # => the output under test, printed for eyeballs
echo "eyeball: looks right?" # => a human answers; the suite cannot
