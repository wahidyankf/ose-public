# => Kata 7 solution: check state first; reruns converge, never crash.
set -euo pipefail # => strict header first, as in every script
# => WHY check-first: reruns must converge to ready, not crash.
state="$(mktemp -d)"              # => private state dir under /tmp for the demo
cleanup() {                       # => remove the state dir on every exit path
	rm -rf "${state}"                # => the state dir vanishes with the script
}                                 # => closes the state cleaner
trap cleanup EXIT                 # => removal runs on success, error, or signal exits
ensure_ready() {                  # => converge to ready: create once, confirm always
	if [ -f "${state}/ready" ]; then # => state already converged
		echo "already ready"            # => reruns report convergence, not work
	else                             # => first run: the marker is missing
		touch "${state}/ready"          # => converge the state exactly once
		echo "created"                  # => only the first run does the work
	fi                               # => closes the convergence branch
}                                 # => closes the idempotent step
ensure_ready                      # => first call does the work
ensure_ready                      # => second call proves reruns converge safely
