# => Four steps; the loop starts at step three.
# => Checkpointing saves the first two.
steps = ["read", "plan", "exec-loop", "report"]  # => the four fixture steps in order
# => steps has 4 entries (type: list)
done = ["read", "plan"]  # => steps finished before the loop began
# => done holds two steps
checkpoint = list(done)  # => checkpoint copies the finished work
# => copy, so later edits cannot alias it
print("checkpoint: " + ", ".join(checkpoint))  # => Output: checkpoint: read, plan
interrupted = True  # => the operator interrupts the stuck loop
# => interruption is explicit fixture data
print("interrupted: " + str(interrupted))  # => Output: interrupted: True
tail = [s for s in steps if s not in checkpoint]  # => the unfinished tail resumes after interrupt
# => tail is exec-loop and report
print("resume tail: " + ", ".join(tail))  # => Output: resume tail: exec-loop, report
replays = [s for s in tail if s in checkpoint]  # => tail steps already finished would replay
# => replays is empty: the tail is all new
print("steps replayed: %d" % len(replays))  # => Output: steps replayed: 0
