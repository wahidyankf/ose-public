# => Example 58: trap INT to clean up instead of dying mid-write.
set -euo pipefail # => strict header first, as in every example
# => WHY trap INT: the default disposition kills without cleaning.
scratch="$(mktemp -d)"       # => private dir under /tmp, like real tools use
cleanup() {                  # => the interrupt handler: clean up, then report loudly
	rm -rf "${scratch}"         # => remove the scratch dir first
	echo "interrupted: cleaned" # => fixed marker proves the handler ran
}                            # => closes the interrupt handler
trap cleanup INT             # => SIGINT runs cleanup instead of killing silently
touch "${scratch}/work.txt"  # => real work would stage files here
kill -INT $$                 # => self-signal: the deterministic stand-in for Ctrl-C
echo "after interrupt"       # => reached: the handler returned, did not exit
