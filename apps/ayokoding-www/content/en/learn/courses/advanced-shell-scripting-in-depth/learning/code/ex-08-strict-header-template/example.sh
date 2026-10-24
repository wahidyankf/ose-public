# => Example 8: header plus main plus quoted forwarding, nothing else.
set -euo pipefail # => the default: fail loudly, never silently
# => WHY main: one entry point keeps top-level flow readable at a glance.
main() {                 # => every real action lives inside main, never at top level
	echo "received $# args" # => $# counts arguments without naming them
}                        # => closes the single entry point of the script
# => Quoted forwarding: each argument arrives exactly as the caller sent it.
main "$@" # => call main with the script arguments, quoted
