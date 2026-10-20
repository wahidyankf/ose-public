# => Buggy: interrupt wipes the finished work.
# => The resume replays everything.
steps = ["read", "plan", "exec-loop", "report"]  # => the four fixture steps
done = ["read", "plan"]  # => two steps finished before the loop
# => finished work worth keeping
print("interrupted: True")  # => the operator stops the loop
replay = list(steps)  # => BUG: resume replays from scratch
# => finished steps run twice
print("replayed steps: %d" % len(replay))  # => Output: replayed steps: 4, wastefully
