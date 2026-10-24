# => Example 29: mktemp -d plus an EXIT trap is the scratch pattern.
set -euo pipefail # => strict header first, as in every example
# => WHY three lines together: create, trap removal, then work inside.
scratch="$(mktemp -d)" # => unique private dir under /tmp, no collisions
cleanup() {            # => remove the staging dir on every exit path
	rm -rf "${scratch}"   # => the scratch dir vanishes with the script
}                      # => closes the scratch cleaner
trap cleanup EXIT      # => removal runs on every exit path
echo "beta
alpha" >"${scratch}/input.txt"       # => stage input in scratch
LC_ALL=C sort "${scratch}/input.txt" # => the real work reads from scratch
echo "scratch used"                  # => fixed marker: nothing outside /tmp was touched
