# => Kata 8 starter: bare echoes with no levels and no quiet mode.
# => Operators cannot silence it and greps cannot filter it.
set -euo pipefail # => strict header first, as in every script
echo "starting"   # => progress line one, always printed
echo "working"    # => progress line two, always printed
echo "done"       # => progress line three, always printed
