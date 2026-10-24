# => Example 33: one EXIT trap fans out to a stack of named handlers.
set -euo pipefail # => strict header first, as in every example
# => WHY a stack: bash runs ONE exit handler, scripts clean MANY resources.
handlers=""                # => space-separated stack of handler names, in run order
on_exit() {                # => push a handler name onto the stack
	handlers="${handlers} $1" # => append the new name after a space
}                          # => closes the stack push
run_handlers() {           # => run every stacked handler in registration order
	# shellcheck disable=SC2086  # => deliberate split: one word per handler
	for h in ${handlers}; do # => DELIBERATELY unquoted: split is the intent
		"${h}"                  # => call the handler by name, quoted as a command
	done                     # => every registered handler ran exactly once
}                         # => closes the fan-out runner
clean_a() {               # => first resource cleaner
	echo "cleaned a"         # => fixed marker proves handler one ran
}                         # => closes handler one
clean_b() {               # => second resource cleaner
	echo "cleaned b"         # => fixed marker proves handler two ran
}                         # => closes handler two
on_exit clean_a           # => register handler one
on_exit clean_b           # => register handler two
trap run_handlers EXIT    # => the single EXIT trap fans out to the stack
echo "work done"          # => the work runs before any handler
