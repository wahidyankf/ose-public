# => Example 51: sorted terms traverse in order without any comparator.
rows = [{"grace", 85}, {"ada", 36}, {"alan", 40}]
# => sort orders tuples element by element: name first, then age.
by_name = Enum.sort(rows)
# => sort_by with a key function ranks by the extracted field alone.
by_age = Enum.sort_by(rows, fn {_name, age} -> age end)
# => :ordered_set... gb_trees keep sort order across inserts and reads.
tree = :gb_trees.from_orddict(Enum.sort([{"b", 2}, {"a", 1}]))
# => to_list reads the tree back in key order, deterministically.
IO.puts("by_name=#{inspect(by_name)} by_age=#{inspect(by_age)}")
# => The tree round-trips in key order regardless of insertion order.
IO.puts("tree=#{inspect(:gb_trees.to_list(tree))}")
