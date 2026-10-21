# => Kata 2 starter: a three-step loop with no signal handling at all.
# => Ctrl-C mid-loop would kill it without cleaning the step files.
set -euo pipefail             # => strict, but strict alone does not catch signals
for step in one two three; do # => three fixed steps, no interruptions handled
	echo "step: ${step}"         # => each step prints in fixed order
done                          # => all three steps ran
