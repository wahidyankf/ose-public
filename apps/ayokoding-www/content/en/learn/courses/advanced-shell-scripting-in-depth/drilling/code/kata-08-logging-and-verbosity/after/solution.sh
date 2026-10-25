# => Kata 8 solution: leveled logging with a verbosity switch.
set -euo pipefail # => strict header first, as in every script
# => WHY levels: quiet by default, verbose on request, errors always.
verbose="yes"                      # => demo default: verbose on so the transcript is full
log() {                            # => one logging entry point for the whole script
	echo "log: $*"                    # => fixed prefix keeps logs greppable
}                                  # => closes the log entry point
debug() {                          # => verbose-only lines for troubleshooting
	if [ "${verbose}" = "yes" ]; then # => quiet mode skips these lines
		log "debug: $*"                  # => debug lines ride the same entry point
	fi                                # => closes the verbosity gate
}                                  # => closes the debug helper
log "starting"                     # => always printed: operators watch for it
debug "details"                    # => printed only when verbose is yes
log "done"                         # => always printed: the closing marker
