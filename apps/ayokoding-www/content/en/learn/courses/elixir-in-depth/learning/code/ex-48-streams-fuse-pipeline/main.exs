# => Example 48: streams fuse stages; Enum would allocate between each.
# => Stream builds a composable recipe; nothing runs until Enum demands it.
recipe = 1..100 |> Stream.map(fn x -> x * 2 end) |> Stream.filter(fn x -> rem(x, 3) == 0 end) # => the lazy fused recipe.
# => take pulls exactly three elements, so the infinite-safe recipe stays lazy.
first = Enum.take(recipe, 3) # => pull three; the rest never runs.
# => The fused pipeline touches six inputs for three outputs, not one hundred.
counted = # => the same fusion written as one pipeline.
  1..100 # => the fixed input range.
  |> Stream.map(fn x -> x * 2 end) # => stage one doubles lazily.
  |> Stream.filter(fn x -> rem(x, 3) == 0 end) # => stage two filters lazily.
  |> Enum.take(3) # => demand three; fusion does the rest.
# => Range streams enumerate on demand; chunk_every bounds the windows.
windows = 1..6 |> Stream.chunk_every(2) |> Enum.map(&Enum.sum/1) # => windowed sums on demand.
# => Print the fused results and the window sums with fixed labels.
IO.puts("first=#{inspect(first)} fused=#{inspect(counted)} windows=#{inspect(windows)}") # => fusion and window proofs.
