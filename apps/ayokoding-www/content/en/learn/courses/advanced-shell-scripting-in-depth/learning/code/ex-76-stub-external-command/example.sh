# => Example 76: a same-named function shadows the real network tool.
set -euo pipefail # => strict header first, as in every example
# => WHY a function stub: no fixture executables, no network, same call shape.
curl() {                                  # => shadows the real curl for this script only
	echo "stubbed curl: $*"                  # => fixed prefix plus the received arguments
}                                         # => closes the stub: no network ever leaves the harness
fetch() {                                 # => the code under test: calls curl exactly once
	curl -s "https://example.invalid/status" # => the URL is never fetched
}                                         # => closes the code under test
out="$(fetch)"                            # => capture what the code under test produced
echo "${out}"                             # => the stubbed response, byte for byte
echo "no network used"                    # => fixed marker: the stub held
