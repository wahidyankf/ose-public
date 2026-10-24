# => Example 32: swap the EXIT handler for one section, then restore it.
set -euo pipefail # => strict header first, as in every example
# => WHY two handlers: debug keeps evidence, standard cleans it.
scratch="$(mktemp -d)"              # => private scratch dir under /tmp
cleanup() {                         # => the standard handler: remove scratch, confirm loudly
	rm -rf "${scratch}"                # => remove the scratch dir
	echo "standard cleanup"            # => names the handler that ran at exit
}                                   # => closes the standard handler
debug_cleanup() {                   # => the debug handler: keep evidence, say so
	echo "debug cleanup: scratch kept" # => names the handler that ran
}                                   # => closes the debug handler
trap cleanup EXIT                   # => standard handler first
echo "normal work"                  # => first section runs under standard cleanup
trap debug_cleanup EXIT             # => swap handlers for the debug section
echo "debug section"                # => middle section runs under debug cleanup
trap cleanup EXIT                   # => restore the standard handler before the end
echo "done"                         # => last section runs under standard cleanup again
