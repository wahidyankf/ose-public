# => Example 1: the strict header every course script starts with (-e, -u, pipefail).
set -euo pipefail # => the default: fail loudly, never silently
# => -e aborts on failure; -u rejects unset vars; pipefail catches mid-pipe failures.
echo "strict mode: on" # => fixed output proves the header parses and runs
