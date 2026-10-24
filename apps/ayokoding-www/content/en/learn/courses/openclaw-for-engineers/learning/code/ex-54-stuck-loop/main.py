# => Seven calls; the exec retry repeats four times.
# => Three identical repeats declare the loop stuck.
trace = ["read", "exec", "exec", "exec", "exec", "message", "exec"]  # => fixture tool-call sequence in order
# => trace has 7 entries (type: list)
LIMIT = 3  # => three repeats mark a stuck loop
# => two retries are patience, three are stuck
best_tool, best_run = None, 0  # => best tracks the longest repeat run seen
# => tuple assignment in one line
run, current = 1, trace[0]  # => the running streak starts at the first call
# => run counts, current names the tool
for tool in trace[1:]:  # => scan from the second call onward
    if tool == current:  # => a repeat extends the streak
        run += 1  # => the streak grows by one
        # => run reaches 4 for the exec block
    else:  # => a new tool ends the streak
        current, run = tool, 1  # => reset the streak on the new tool
        # => tuple reset keeps it branchless
    if run > best_run:  # => remember the longest streak so far
        best_tool, best_run = current, run  # => best becomes exec at 4
        # => tuple update mirrors the reset
print("longest repeat: %s x%d" % (best_tool, best_run))  # => Output: longest repeat: exec x4
stuck = best_run >= LIMIT  # => the limit turns a streak into a verdict
# => stuck is True here
print("session stuck: " + str(stuck))  # => Output: session stuck: True
