# => Kata 6 starter: a hand-rolled counter with a one-shot protocol.
counter = spawn(fn -> # => the counter process; one receive inside.
  # => The process waits for one add message, then answers exactly once.
  receive do # => the single receive.
    {:add, back, n} -> send(back, {:added, n}) # => answer once, then exit.
  end # => the receive closes.
end) # => the spawn closes; counter holds the pid.
# => One add works; the second add would need a loop the starter lacks.
send(counter, {:add, self(), 41}) # => ask the counter to add 41.
# => The reply pattern names the only message this counter ever sends.
got = receive do {:added, n} -> n after 1000 -> :lost end # => wait for the single reply.
# => Print the one-shot count with a fixed label.
IO.puts("count=#{got}") # => count=41.
