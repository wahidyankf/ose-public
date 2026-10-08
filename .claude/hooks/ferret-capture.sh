#!/bin/sh
# Shared POSIX capture wrapper for the FERRET hooks of Claude Code and Codex: ferret-capture.sh <harness> <event>
#
# It hands its standard input, untouched, to `ferret capture-hook --harness <harness> --event <event>` and can never
# disturb the harness that called it: both output streams are discarded, TERM and KILL are requested at 900/1,000 ms,
# with a cumulative 350 ms host allowance and 250 ms reap tail; the exit status is always zero. It never parses, maps,
# or hashes the payload; every privacy decision lives in the Python command it runs. `ferret` is FERRET_BIN when set, else the one on
# PATH, else the user-level launcher, so a PATH that lacks ~/.local/bin does not silently lose telemetry.

harness=${1:-}
event=${2:-}

bin=${FERRET_BIN:-}
if [ -z "$bin" ]; then
	bin=$(command -v ferret 2>/dev/null) || bin=
fi
if [ -z "$bin" ] && [ -x "${HOME:-}/.local/bin/ferret" ]; then
	bin=$HOME/.local/bin/ferret
fi
[ -n "$bin" ] || exit 0

# Standard input moves to descriptor 3 because a background command in a non-interactive shell would otherwise read
# /dev/null instead of it; the watchdog gets no copy.
exec 3<&0 >/dev/null 2>&1
# Allocate one private regular certificate before capture and timer deadlines.
# Failed allocation skips telemetry silently; it must not start the capture child.
certificate=$(mktemp "${TMPDIR:-/tmp}/ferret-watchdog.XXXXXX") || exit 0
if [ -z "$certificate" ] || [ ! -f "$certificate" ] || [ -L "$certificate" ]; then
	rm -f -- "$certificate"
	exit 0
fi
"$bin" capture-hook --harness "$harness" --event "$event" <&3 3<&- &
child=$!
(
	# This subshell launches only the two sequential sleep jobs. Latest $! can
	# still name an inherited or reaped job, so only its own Running record qualifies.
	inherited_async=$!
	active_timer() {
		LC_ALL=C jobs -l >"$certificate" || return 1
		records=0
		record=
		while IFS= read -r record; do
			records=$((records + 1))
			# Builtin field reading stays in this shell; command text is never executed.
			read -r tag first second third _description <<EOF
$record
EOF
			case $tag in
			\[*\]+ | \[*\]-)
				job=${tag#\[}
				job=${job%\]*}
				case $tag in "[$job]+" | "[$job]-") ;; *) return 1 ;; esac
				observed=$first
				state=$second
				;;
			\[*\])
				job=${tag#\[}
				job=${job%\]}
				case $first in + | -) ;; *) return 1 ;; esac
				observed=$second
				state=$third
				;;
			*) return 1 ;;
			esac
			case $job in '' | *[!0-9]*) return 1 ;; esac
			[ "$job" -gt 0 ] || return 1
			[ "$observed" = "$timer" ] && [ "$state" = Running ] || return 1
		done <"$certificate"
		[ -z "$record" ] && [ "$records" -eq 1 ]
	}
	retire_timer() {
		timer=$!
		case $timer in '' | *[!0-9]*) return ;; esac
		[ "$timer" -gt 0 ] && [ "$timer" != "$inherited_async" ] || return
		if active_timer; then
			# Never signal a job specification or group. KILL also retires a timer
			# that ignores TERM; wait reaps it before the watchdog can return.
			if kill -KILL "$timer" 2>/dev/null; then
				wait "$timer" 2>/dev/null || :
			fi
		fi
	}
	trap 'retire_timer; exit 0' TERM
	sleep 0.9 &
	sleeper=$!
	wait "$sleeper"
	kill -TERM "$child" 2>/dev/null
	sleep 0.1 &
	sleeper=$!
	wait "$sleeper"
	kill -KILL "$child" 2>/dev/null
) 3<&- &
watchdog=$!
exec 3<&- 0<&-
wait "$child"
kill "$watchdog" 2>/dev/null
wait "$watchdog" 2>/dev/null
rm -f -- "$certificate"
exit 0
