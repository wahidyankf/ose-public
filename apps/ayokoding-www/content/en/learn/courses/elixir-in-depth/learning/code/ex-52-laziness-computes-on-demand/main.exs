# => Example 52: laziness computes on demand; placement decides the cost.
calls = :counters.new(1, [])
# => The stream recipe records no calls until something enumerates it.
recipe = Stream.map(1..10, fn x -> :counters.add(calls, 1, 1); x * 2 end)
# => Before enumeration the counter proves nothing ran yet.
IO.puts("before=#{:counters.get(calls, 1)}")
# => take(3) runs exactly three applications, then stops the stream.
first = Enum.take(recipe, 3)
# => The counter proves three runs, not ten: laziness is measured, not hoped.
IO.puts("first=#{inspect(first)} after=#{:counters.get(calls, 1)}")
