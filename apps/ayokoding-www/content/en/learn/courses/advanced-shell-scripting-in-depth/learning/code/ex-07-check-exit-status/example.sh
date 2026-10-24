# => Example 7: save $? at once; the next command would overwrite it.
set -euo pipefail # => strict header first, as in every example
# => WHY set +e here: grep exits 1 on no match, which -e calls fatal.
set +e                  # => the status-capture section runs with -e relaxed
grep -q "ERROR" app.log # => quiet grep: status only, no output lines
status=$?               # => save it NOW: any command, even echo, overwrites $?
set -e                  # => strict again before acting on the captured status
# => Branch on the saved value, never on a stale $? later on.
if [ "${status}" -eq 0 ]; then # => 0 means grep found the pattern
	echo "found errors"           # => would print for a log containing ERROR
else                           # => any nonzero status lands here
	echo "status was: ${status}"  # => prints the saved grep status
fi                             # => closes the branch on the captured status
