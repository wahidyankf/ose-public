# => Kata 5 solution: with flattens the nesting into one left edge.
parse = fn text -> # => one closure; arrows replace the nesting.
  # => Each left arrow is one old nesting level, now at the same indent.
  with {n, ""} <- Integer.parse(text), # => first arrow: the old outer case.
       true <- n > 0 do # => second arrow: the old inner case.
    {:ok, n} # => both arrows match: success.
  else # => any arrow misses: land here.
    # => false comes first: the bare wildcard below would swallow it.
    false -> {:error, :not_positive} # => the sign failure.
    _ -> {:error, :not_a_number} # => the parse failure.
  end # => the with closes.
end # => the closure closes.
# => Good input doubles through; bad and negative take separate branches.
IO.puts("good=#{inspect(parse.("21"))} bad=#{inspect(parse.("x"))} neg=#{inspect(parse.("-3"))}") # => ok, parse error, sign error.
