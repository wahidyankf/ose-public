# => Example 54: spawn starts a process; send and receive move the message.
me = self()
# => spawn runs the function in a new process; the new pid is private.
worker = spawn(fn -> receive do {:work, from, n} -> send(from, {:done, n * 2}) end end)
# => send is async: the message waits in the mailbox until receive matches.
send(worker, {:work, me, 21})
# => receive blocks with a bound; the reply pattern names the expected shape.
reply = receive do {:done, n} -> n after 1000 -> :timeout end
# => Print the computed reply, never the pid: pids vary between runs.
IO.puts("reply=#{reply}")
