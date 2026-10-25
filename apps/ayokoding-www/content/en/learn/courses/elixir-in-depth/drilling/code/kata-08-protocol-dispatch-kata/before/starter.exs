# => Kata 8 starter: cond branches on type; every type edits this function.
size_of = fn value -> # => one closure; every type lives inside.
  # => Each cond arm repeats the type test the next type must copy.
  cond do # => the type-branch cond.
    is_list(value) -> length(value) # => lists measure by length.
    is_map(value) -> map_size(value) # => maps measure by size.
    is_binary(value) -> byte_size(value) # => binaries measure by bytes.
    true -> 1 # => anything else counts one.
  end # => the cond closes.
end # => the closure closes.
# => The branches work; the fifth type reopens the function.
IO.puts("list=#{size_of.([1, 2])} map=#{size_of.(%{a: 1})} bin=#{size_of.("ab")} other=#{size_of.(:x)}") # => list=2 map=1 bin=2 other=1.
