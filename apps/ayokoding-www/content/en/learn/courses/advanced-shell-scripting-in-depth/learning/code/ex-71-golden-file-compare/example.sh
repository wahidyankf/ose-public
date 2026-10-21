# => Example 71: silent diff against goldens; the branch says the verdict.
set -euo pipefail # => strict header first, as in every example
# => WHY silent diff: the verdict belongs in the message, not in noise.
report="$(mktemp)"                                 # => capture file under /tmp, never in the repo
cleanup() {                                        # => remove the capture on every exit path
	rm -f "${report}"                                 # => the capture file vanishes with the script
}                                                  # => closes the capture cleaner
trap cleanup EXIT                                  # => removal runs on success, error, or signal exits
printf "users: 3\nactive: 2\n" >"${report}"        # => the generator output under test
if diff -u golden.txt "${report}" >/dev/null; then # => silent diff: status only
	echo "report matches golden"                      # => byte-identical to the committed snapshot
else                                               # => any byte differs
	echo "report drifted"                             # => the golden file caught a behaviour change
fi                                                 # => closes the golden comparison
