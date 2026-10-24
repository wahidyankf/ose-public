# => Example 47: one Enum vocabulary serves lists, maps, ranges, and streams.
mixed = %{"b" => 2, "a" => 1, "c" => 3}
# => Enum over a map yields key-value tuples, sorted here for stability.
pairs = mixed |> Enum.sort() |> Enum.map(fn {k, v} -> "#{k}=#{v}" end)
# => Ranges enumerate without allocating; the same map/1 consumes them.
squares = 1..4 |> Enum.map(fn x -> x * x end)
# => Streams are enumerable too: take first, then the vocabulary matches.
head = Stream.cycle(["x", "y"]) |> Enum.take(3)
# => into collects back into a map, closing the round trip through Enum.
back = pairs |> Enum.map(fn s -> String.split(s, "=") |> List.to_tuple() end) |> Map.new()
# => Print each vocabulary result with fixed labels.
IO.puts("pairs=#{inspect(pairs)} squares=#{inspect(squares)} head=#{inspect(head)}")
# => Sorted pairs print deterministically; map key order is not asserted on.
IO.puts("back=#{inspect(back |> Map.to_list() |> Enum.sort())}")
