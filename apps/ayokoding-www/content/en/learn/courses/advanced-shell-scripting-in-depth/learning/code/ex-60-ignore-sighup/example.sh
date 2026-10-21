# => Example 60: trap with an empty body ignores the signal entirely.
set -euo pipefail # => strict header first, as in every example
# => WHY ignore HUP: detached sections must survive terminal close.
trap "" HUP         # => empty handler means IGNORE for SIGHUP
kill -HUP $$        # => self-signal: ignored, the script never notices
echo "hup ignored"  # => reached: the signal vanished silently
trap - HUP          # => restore the default HUP disposition afterwards
echo "hup restored" # => fixed marker after restoring the default
