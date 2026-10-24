# => Example 56: agents hold synchronous shared state behind a function API.
{:ok, counter} = Agent.start_link(fn -> 0 end) # => the counter agent starting at zero.
# => update runs the function inside the agent; callers never touch state.
Agent.update(counter, fn n -> n + 1 end) # => add one inside the agent.
Agent.update(counter, fn n -> n + 10 end) # => add ten inside the agent.
# => get_and_update returns the old value while installing the new one.
old = Agent.get_and_update(counter, fn n -> {n, n * 2} end) # => pop 11, install 22.
# => get reads the final value without changing it.
final = Agent.get(counter, fn n -> n end) # => read the doubled count.
# => Stop the agent; the script owns its whole lifecycle.
Agent.stop(counter) # => stop what the script started.
# => Print the popped old value and the final doubled count.
IO.puts("old=#{old} final=#{final}") # => popped value plus final count.
