# => Example 12: pipelines short-circuit on error tuples without nesting.
parse = fn text -> # => the parse function every stage below shares.
  case Integer.parse(text) do # => match the raw parse result.
    {n, ""} -> {:ok, n} # => wrap the clean integer as ok.
    _ -> {:error, :not_a_number} # => wrap everything else as error.
  end # => the case closes; the tuple shape is now uniform.
end # => the parse function closes.
# => Each step returns the tuple shape so the next step can match on it.
double_if_ok = fn # => the doubling stage threading the tuple shape.
  {:ok, n} -> {:ok, n * 2} # => double the happy value, keep the wrapper.
  {:error, _} = err -> err # => pass errors through untouched.
end # => the stage function closes.
# => Then threads the happy value while the tuple wrapper stays explicit.
good = parse.("21") |> double_if_ok.() # => good input doubles to 42.
# => The error tuple passes through untouched: no branch, no nesting.
bad = parse.("nope") |> double_if_ok.() # => bad input passes through as error.
# => with is the same idea with do-syntax; here the pipe shows the shape.
report = fn # => the report function rendering either shape.
  {:ok, n} -> "value=#{n}" # => values render as value= lines.
  {:error, reason} -> "error=#{reason}" # => errors render as error= lines.
end # => the report function closes.
# => Print both reports with fixed labels.
IO.puts("good=#{report.(good)} bad=#{report.(bad)}") # => the side-by-side report.
