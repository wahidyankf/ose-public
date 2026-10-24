# => Kata 5 solution: mktemp plus an EXIT trap, no leaks, no collisions.
set -euo pipefail # => strict header first, as in every script
# => WHY mktemp: fixed paths collide between parallel harness runs.
scratch="$(mktemp -d)"      # => private scratch dir under /tmp, writable here
cleanup() {                 # => the exit handler: remove scratch, confirm loudly
	rm -rf "${scratch}"        # => remove the private scratch dir
	echo "cleaned"             # => fixed marker proves the trap actually ran
}                           # => closes the exit handler
trap cleanup EXIT           # => run cleanup on success, error, or signal exits
touch "${scratch}/work.txt" # => prove the scratch dir is usable
echo "work done"            # => fixed marker: real work would happen here
