# => Example 60: registries name processes; callers never hold pids.
{:ok, _} = Registry.start_link(keys: :unique, name: Ex60Reg)
# => The agent registers under a name at start; the pid stays private.
{:ok, _} = Agent.start_link(fn -> 0 end, name: {:via, Registry, {Ex60Reg, "counter"}})
# => lookup resolves the name to exactly one entry for the assertion.
[{_pid, _}] = Registry.lookup(Ex60Reg, "counter")
# => via tuples route updates through the name, surviving restarts in trees.
Agent.update({:via, Registry, {Ex60Reg, "counter"}}, fn n -> n + 41 end)
# => The final read travels the same named route; pids never print.
value = Agent.get({:via, Registry, {Ex60Reg, "counter"}}, fn n -> n end)
# => Print the named-route value with a fixed label.
IO.puts("counter=#{value}")
