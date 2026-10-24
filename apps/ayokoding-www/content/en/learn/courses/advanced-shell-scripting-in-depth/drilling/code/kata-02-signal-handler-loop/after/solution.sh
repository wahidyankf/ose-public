# => Kata 2 solution: an INT trap reports the step, then the loop finishes.
set -euo pipefail # => strict header first, as in every script
# => WHY trap before work: signals arrive at any moment, including line one.
on_interrupt() {                # => the INT handler: report, then keep going
	echo "interrupted at: ${step}" # => names the step in flight, fixed here
}                               # => closes the interrupt handler
trap on_interrupt INT           # => SIGINT reports instead of killing silently
step="none"                     # => default before the loop starts
for step in one two three; do   # => three fixed steps, interruptible
	echo "step: ${step}"           # => each step prints in fixed order
done                            # => all three steps ran
kill -INT $$                    # => self-signal proves the handler runs deterministically
echo "loop done"                # => reached: the handler returned, did not exit
