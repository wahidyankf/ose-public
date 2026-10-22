# => Kata 3 solution: one stdlib call replaces the hand-rolled loop.
line = Enum.join(["ada", "30", "dev"], ",") # => csv=ada,30,dev in one call.
# => upper proves the same vocabulary covers the next transform too.
upper = Enum.join(["a", "b"], ",") |> String.upcase() # => join then upcase: A,B.
# => Print both stdlib results with fixed labels.
IO.puts("csv=#{line}") # => the join proof.
IO.puts("upper=#{upper}") # => the pipeline proof.
