#!/bin/sh
# Shared POSIX capture wrapper for the FERRET hooks of Claude Code and Codex: ferret-capture.sh <harness> <event>
#
# It hands its standard input, untouched, to `ferret capture-hook --harness <harness> --event <event>` and can never
# disturb the harness that called it: both output streams are discarded, a child still running after 900 ms gets TERM,
# one still running after 1,000 ms gets KILL, and the exit status is always zero. It never parses, maps, or hashes the
# payload; every privacy decision lives in the Python command it runs. `ferret` is FERRET_BIN when set, else the one on
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
"$bin" capture-hook --harness "$harness" --event "$event" <&3 3<&- &
child=$!
(
	trap 'kill "$sleeper" 2>/dev/null; exit 0' TERM
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
exit 0
