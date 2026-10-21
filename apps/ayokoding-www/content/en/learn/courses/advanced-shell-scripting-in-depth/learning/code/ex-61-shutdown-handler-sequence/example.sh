# => Example 61: one shutdown handler serves TERM and plain exit.
set -euo pipefail # => strict header first, as in every example
# => WHY one handler: every path cleans the same scratch the same way.
scratch="$(mktemp -d)" # => private dir under /tmp for the demo work
shutdown() {           # => the single shutdown path: clean, then name the cause
	rm -rf "${scratch}"   # => clean the scratch dir on every path
	echo "shutdown: $1"   # => the argument names which path fired
}                      # => closes the single shutdown handler
# => TERM path cleans, disarms EXIT so cleanup runs once, then exits.
trap 'shutdown term; trap - EXIT; exit 0' TERM # => self-signal lands here
trap 'shutdown exit' EXIT                      # => plain exit takes this path instead
kill -TERM $$                                  # => self-signal: the deterministic stand-in for stop
echo "unreached"                               # => never prints: the TERM path exits first
