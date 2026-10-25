# => Example 52: cmp -s checks bytes silently; the branch says the verdict.
set -euo pipefail # => strict header first, as in every example
# => WHY cmp -s: the verdict belongs in the branch message, not in diff noise.
actual="$(mktemp)"                     # => capture file under /tmp, never in the repo
cleanup() {                            # => remove the capture on every exit path
	rm -f "${actual}"                     # => the capture file vanishes with the script
}                                      # => closes the capture cleaner
trap cleanup EXIT                      # => removal runs on success, error, or signal exits
printf "v1\nv2\n" >"${actual}"         # => the command output under test, captured
if cmp -s "${actual}" golden.txt; then # => silent compare: status only
	echo "matches golden"                 # => byte-identical to the committed snapshot
else                                   # => any byte differs
	echo "golden mismatch"                # => the snapshot caught a behaviour change
fi                                     # => closes the golden comparison
