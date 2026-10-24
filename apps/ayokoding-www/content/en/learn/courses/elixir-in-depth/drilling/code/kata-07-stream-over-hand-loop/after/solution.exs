# => Kata 7 solution: one fused stream pass replaces the three lists.
taken = # => the pipeline binds here; stages follow.
  1..100 # => the range source; nothing computed yet.
  |> Stream.map(fn x -> x * 2 end) # => lazy double stage.
  |> Stream.filter(fn x -> rem(x, 4) == 0 end) # => lazy keep-multiples stage.
  |> Enum.take(3) # => the single strict pass: [4, 8, 12].
# => Identical answer, one pass, no intermediate lists at all.
IO.puts("taken=#{inspect(taken)}") # => taken=[4, 8, 12].
