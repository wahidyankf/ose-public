# => Example 55: receive matches selectively; after bounds the wait.
me = self() # => the mailbox all three sends land in.
# => Queue three messages; receive picks by pattern, not arrival order.
send(me, {:slow, 1}) # => first arrival: a slow message.
send(me, {:fast, 2}) # => second arrival: the fast message.
send(me, {:slow, 3}) # => third arrival: another slow message.
# => The fast clause matches first even though it arrived second.
picked = receive do {:fast, n} -> n after 1000 -> :timeout end # => pattern beats arrival order.
# => The slow messages remain; collect both, then sort for stability.
rest = # => the leftover slow values, sorted.
  [ # => receive twice; each call takes the next slow message.
    receive do {:slow, n} -> n after 1000 -> :missing end, # => first leftover.
    receive do {:slow, n} -> n after 1000 -> :missing end # => second leftover.
  ] # => the two-element list closes.
  |> Enum.sort() # => sort for a stable report.
# => A bounded wait on an empty mailbox proves the after branch exactly.
empty = receive do {:never, _} -> "arrived" after 50 -> "empty" end # => the empty-mailbox proof.
# => Print the selection, the leftovers, and the empty proof.
IO.puts("picked=#{picked} rest=#{inspect(rest)} empty=#{empty}") # => selection plus leftovers transcript.
