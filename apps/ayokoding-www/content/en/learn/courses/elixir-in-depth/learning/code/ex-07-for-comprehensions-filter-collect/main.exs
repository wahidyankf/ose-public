# => Example 7: for comprehensions filter, transform, and collect in one read.
pairs = for x <- [1, 2, 3, 4], rem(x, 2) == 0, do: x * 10
# => Multiple generators nest; each filter sits beside its own generator.
grid = for r <- 1..2, c <- 1..2, r != c, do: {r, c}
# => into collects into any Collectable, not just lists.
as_map = for n <- ["a", "b"], into: %{}, do: {n, String.upcase(n)}
# => A pattern on the left silently skips elements that do not match.
oks = for {:ok, v} <- [ok: 1, error: :x, ok: 2], do: v
# => Print the four collections with fixed labels.
IO.puts("pairs=#{inspect(pairs)} grid=#{inspect(grid)}")
# => Map keys print in term order; unmatched entries never appear.
IO.puts("as_map=#{inspect(as_map)} oks=#{inspect(oks)}")
