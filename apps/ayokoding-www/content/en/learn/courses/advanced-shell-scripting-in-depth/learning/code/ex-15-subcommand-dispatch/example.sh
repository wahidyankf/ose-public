# => Example 15: dispatch on $1 like git does: verb first, rest after.
set -euo pipefail # => strict header first, as in every example
# => WHY functions per verb: adding a subcommand adds one branch plus one fn.
cmd_deploy() {               # => the deploy subcommand implementation
	echo "deploying version $1" # => $1 here is the version operand
}                            # => closes the deploy implementation
cmd_status() {               # => the status subcommand implementation
	echo "status: idle"         # => fixed state line for the demo
}                            # => closes the status implementation
# => WHY fixed demo argv: dispatch must show one constant path.
set -- status   # => demo runs the status subcommand
case "${1-}" in # => ${1-} stays safe under -u with no argv
deploy)
	shift
	cmd_deploy "$@" # => consume verb, forward the rest
	;;              # => ends the deploy branch
status)
	shift
	cmd_status "$@" # => consume verb, forward the rest
	;;              # => ends the status branch
*)
	echo "usage: tool {deploy|status}" >&2 # => usage goes to stderr
	exit 2                                 # => unknown verb is a usage error: exit 2
	;;                                     # => ends the unknown-verb branch
esac                                    # => closes the subcommand dispatch
