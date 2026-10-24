# => Example 55: wait on one PID returns that job's exit status.
set -euo pipefail # => strict header first, as in every example
# => WHY set +e: the collection must observe failure, not die on it.
set +e               # => job failures become collectible, not fatal, below
false &              # => background job that fails with exit 1
failed_pid=$!        # => remember WHICH job to ask about, never printed
wait "${failed_pid}" # => reap one job AND return its status
echo "job exits: $?" # => 1: the background failure, collected
set -e               # => strict again after the collection
echo "collected"     # => fixed marker: the failure was handled
