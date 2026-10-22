# => Kata 3 starter: a hand-rolled join that Enum already provides.
join = fn # => multi-clause closure; one clause per input shape.
  # => Empty input returns empty output without a special caller branch.
  [] -> "" # => the empty clause.
  # => Reduce threads the separator through every non-empty tail.
  [h | t] -> Enum.reduce(t, h, fn x, acc -> acc <> "," <> x end) # => the cons clause folds the tail.
end # => the closure closes.
# => The helper works; the standard library makes it one call.
IO.puts("csv=#{join.(["ada", "30", "dev"])}") # => csv=ada,30,dev through the hand roll.
