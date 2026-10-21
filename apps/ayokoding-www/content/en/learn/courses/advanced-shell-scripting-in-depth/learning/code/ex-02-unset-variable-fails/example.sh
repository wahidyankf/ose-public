# => Example 2: -u turns a misspelled variable into a loud failure.
set -euo pipefail # => strict header first, as in every example
# shellcheck disable=SC2034 # rationale: demo references the misspelled name to trigger -u
output_dir="build/out" # => the real variable the script means to use
# => WHY a subshell: the typo must fail without killing this demo script.
if (echo "${OUTPT_DIR}/" >/dev/null); then # => runs the typo in isolation
	echo "unexpected: typo expanded"          # => never reached when -u is on
else                                       # => the typo failed, exactly as strict mode promises
	echo "caught: OUTPT_DIR is unset"         # => fixed label names the mistake
fi                                         # => closes the guarded probe of the typo
