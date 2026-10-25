# => Example 51: tee splits one stream; files keep consumers ordered.
set -euo pipefail # => strict header first, as in every example
# => WHY files: two live consumers on one stdout interleave randomly.
scratch="$(mktemp -d)"                                           # => private dir under /tmp for the two copies
cleanup() {                                                      # => remove both copies on every exit path
	rm -rf "${scratch}"                                             # => the copy dir vanishes with the script
}                                                                # => closes the copy cleaner
trap cleanup EXIT                                                # => removal runs on success, error, or signal exits
printf "one\ntwo\n" | tee "${scratch}/a.txt" >"${scratch}/b.txt" # => one stream becomes two identical files
echo "copy a:"                                                   # => fixed label before the first copy
cat "${scratch}/a.txt"                                           # => first consumer reads in fixed order
echo "copy b:"                                                   # => fixed label before the second copy
cat "${scratch}/b.txt"                                           # => second consumer reads the same bytes
