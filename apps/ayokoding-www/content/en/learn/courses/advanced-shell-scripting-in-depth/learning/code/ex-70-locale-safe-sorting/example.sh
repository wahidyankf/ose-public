# => Example 70: LC_ALL=C pins byte order identical on every machine.
set -euo pipefail # => strict header first, as in every example
# => WHY pin the locale: language locales interleave cases unpredictably.
LC_ALL=C sort words.txt # => byte-order sort: same bytes everywhere
echo "sorted"           # => fixed marker after the deterministic order
