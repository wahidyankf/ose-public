# => Kata 7 starter: three Enum passes allocate three intermediate lists.
nums = Enum.to_list(1..100) # => materialize 1 to 100 as a list.
# => Each pass walks the whole list and builds another one.
doubled = Enum.map(nums, fn x -> x * 2 end) # => pass one: double everything.
evens = Enum.filter(doubled, fn x -> rem(x, 4) == 0 end) # => pass two: keep multiples of four.
taken = Enum.take(evens, 3) # => pass three: take the head three.
# => The answer is right; the allocation is triple what one pass needs.
IO.puts("taken=#{inspect(taken)}") # => taken=[4, 8, 12].
