# => Example 74: setup builds the world, trapped teardown removes it.
set -euo pipefail # => strict header first, as in every example
# => WHY trapped teardown: failing tests must clean up exactly like passing ones.
setup() {                                              # => build the fixture world before each test
	stage="$(mktemp -d)"                                  # => fresh private stage per run, under /tmp
	printf "row1\nrow2\n" >"${stage}/data.csv"            # => the fixture under test
}                                                      # => closes the setup step
teardown() {                                           # => destroy the fixture world after each test
	rm -rf "${stage}"                                     # => remove the stage the setup built
	echo "torn down"                                      # => fixed marker proves teardown ran
}                                                      # => closes the teardown step
trap teardown EXIT                                     # => teardown runs even when a test fails below
setup                                                  # => build the world first
echo "rows: $(wc -l <"${stage}/data.csv" | tr -d " ")" # => the test reads the fixture
