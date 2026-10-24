# => Example 4: -e halts the script at the first failing command.
set -euo pipefail # => strict header first, as in every example
# => WHY a subshell: the halt must be observable without ending the demo.
# => WHY set +e: the probes below fail on purpose and must not abort.
set +e # => failing probes are observable, not fatal, below
(
	set -e
	false
	echo "reached"
)                             # => -e stops before the echo runs
echo "strict probe exits: $?" # => subshell status is the failure
# => Contrast: without -e the failure prints and execution continues.
(
	set +e
	false
	code=$?
	echo "continued"
	exit "${code}"
)                          # => no -e: echo runs, exit carries the failure
echo "lax probe exits: $?" # => subshell still reports the failure
set -e                     # => strict again: the demonstration section is over
