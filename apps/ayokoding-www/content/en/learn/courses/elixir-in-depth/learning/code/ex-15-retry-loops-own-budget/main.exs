# => Example 15: retry loops carry their own budget instead of looping forever.
attempt = fn n -> # => the attempt function simulating flaky work.
  # => The first two attempts fail; the third succeeds, deterministically.
  if n < 3, do: {:error, :flaky}, else: {:ok, "connected"} # => fail twice, then connect.
end # => the attempt function closes.
# => Recursion with a countdown makes the budget visible in the signature.
retry = fn self, n, left -> # => self, try number, and remaining budget.
  case attempt.(n) do # => match the attempt result shape.
    # => Success returns the value with attempts spent, for the report.
    {:ok, value} -> {:ok, value, n} # => value plus the tries it took.
    # => Zero budget left converts the last failure into a final answer.
    {:error, _} when left == 1 -> {:error, :gave_up} # => the budget binds here.
    # => Otherwise recurse with one less attempt and a higher try number.
    {:error, _} -> self.(self, n + 1, left - 1) # => spend one, try again.
  end # => the case closes; every path returns a final answer.
end # => the retry function closes.
# => Three attempts succeed on the last one; one attempt gives up at once.
IO.puts("plenty=#{inspect(retry.(retry, 1, 3))}") # => success on the third try.
# => The single-attempt run proves the budget binds instead of hoping.
IO.puts("single=#{inspect(retry.(retry, 1, 1))}") # => gave_up with one try.
