# => Example 9: ok and error tuples flow through with to one decision point.
parse = fn text -> # => the parse function both with blocks share.
  # => Integer.parse returns a tuple, so wrap it into the ok/error shape.
  case Integer.parse(text) do # => match the raw parse result.
    # => Full consumption means the whole string was a number.
    {n, ""} -> {:ok, n} # => wrap the clean integer as ok.
    # => Anything else is an expected failure, not an exception.
    _ -> {:error, :not_a_number} # => wrap everything else as error.
  end # => the case closes; the tuple shape is now uniform.
end # => the parse function closes.
# => The happy path doubles the parsed value inside the do block.
doubled = # => the doubled binding the first with returns into.
  with {:ok, n} <- parse.("21"), # => step one parses the good input.
       # => Guards inside with read as assertions on the flowing value.
       true <- n > 0 do # => step two asserts positivity.
    n * 2 # => the doubled happy value.
  else # => short-circuits land here, matched by value.
    # => Each short-circuit value gets its own message clause.
    {:error, :not_a_number} -> "bad input" # => the parse-failure message.
    false -> "must be positive" # => the non-positive message.
  end # => the with closes; doubled holds one of three strings.
# => The same shape handles the failing input without new code.
failed = # => the failed binding the second with returns into.
  with {:ok, n} <- parse.("abc"), # => step one fails on letters.
       true <- n > 0 do # => step two never runs.
    n * 2 # => unreachable for the bad input.
  else # => the same else shape handles the same failure kinds.
    {:error, :not_a_number} -> "bad input" # => the identical message.
    false -> "must be positive" # => the identical fallback.
  end # => the with closes; failed holds the bad-input message.
# => Print both outcomes with fixed labels.
IO.puts("doubled=#{doubled} failed=#{failed}") # => the side-by-side outcome report.
