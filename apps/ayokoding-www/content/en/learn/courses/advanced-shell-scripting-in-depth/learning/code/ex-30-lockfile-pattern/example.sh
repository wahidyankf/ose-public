# => Example 30: mkdir is atomic, so it makes a perfect mutex.
set -euo pipefail # => strict header first, as in every example
# => WHY mkdir over touch: creation is atomic, exactly one holder wins.
lock_dir="/tmp/advanced-shell-ex30.lock" # => fixed lock path: the point of a lock
release() {                              # => unlock on every exit path
	rmdir "${lock_dir}"                     # => remove the lock dir to release it
}                                        # => closes the lock release
if mkdir "${lock_dir}" 2>/dev/null; then # => atomic acquire: one winner only
	trap release EXIT                       # => release the lock on every exit path
	echo "lock acquired"                    # => this run won the lock
	echo "working under lock"               # => protected work happens here
else                                     # => someone else already holds the lock
	echo "already running"                  # => the second instance backs off loudly
	exit 1                                  # => contention is a runtime failure: exit 1
fi                                       # => closes the atomic-acquire branch
