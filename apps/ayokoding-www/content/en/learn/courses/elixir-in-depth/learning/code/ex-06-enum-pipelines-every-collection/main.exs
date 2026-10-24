# => Example 6: one Enum vocabulary maps, filters, and folds every collection.
orders = [%{item: "book", qty: 2}, %{item: "pen", qty: 5}, %{item: "ink", qty: 1}] # => the fixed order list every stage reads.
# => Pipes read top to bottom; each stage names one transform.
total = orders |> Enum.map(fn o -> o.qty end) |> Enum.sum() # => project quantities, then sum them.
# => Filter then map keeps the pipeline stages single-purpose.
big = orders |> Enum.filter(fn o -> o.qty > 1 end) |> Enum.map(fn o -> o.item end) # => keep big orders, name their items.
# => Reduce folds with an explicit accumulator instead of loop state.
names = orders |> Enum.reduce([], fn o, acc -> [o.item | acc] end) |> Enum.reverse() # => prepend-fold, then restore order.
# => group_by partitions by a key function in a single pass.
many = # => the big-group names sorted for a stable report.
  orders # => partition the same fixed orders by the bigness predicate.
  |> Enum.group_by(fn o -> o.qty > 1 end) # => one pass, two buckets.
  |> Map.get(true) # => keep the big bucket for the report.
  |> Enum.map(fn o -> o.item end) # => name the big items.
  |> Enum.sort() # => sort for determinism.
# => Print the sum, the filtered names, the folded names, and the group.
IO.puts("total=#{total} big=#{inspect(big)} names=#{inspect(names)} many=#{inspect(many)}") # => the four vocabulary answers.
