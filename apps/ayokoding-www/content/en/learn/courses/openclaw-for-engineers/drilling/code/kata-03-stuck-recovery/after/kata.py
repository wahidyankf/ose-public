# => Fixed: checkpoint keeps finished steps.
# => Only the unfinished tail replays.
steps = ["read", "plan", "exec-loop", "report"]  # => the same four fixture steps
# => facts did not change
done = ["read", "plan"]  # => the same two finished steps
# => checkpoint preserves them
print("interrupted: True")  # => the operator stops the loop
tail = [s for s in steps if s not in done]  # => FIX: replay only unfinished steps
# => tail is exec-loop and report
print("replayed steps: %d" % len(tail))  # => Output: replayed steps: 2, correctly
