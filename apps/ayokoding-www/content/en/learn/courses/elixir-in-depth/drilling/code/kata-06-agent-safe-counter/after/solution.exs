# => Kata 6 solution: the agent owns the loop; callers keep functions.
{:ok, counter} = Agent.start_link(fn -> 0 end) # => counter starts at zero.
# => Updates compose: two adds run as two calls, no protocol to extend.
Agent.update(counter, fn n -> n + 40 end) # => first add: 0 becomes 40.
Agent.update(counter, fn n -> n + 1 end) # => second add: 40 becomes 41.
# => get reads the final value; the agent stops with the script.
value = Agent.get(counter, fn n -> n end) # => read 41 out.
Agent.stop(counter) # => stop the agent; the script owns it.
# => Print the composed count with a fixed label.
IO.puts("count=#{value}") # => count=41.
