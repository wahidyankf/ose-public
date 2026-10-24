# => Example 3: with chains the happy path and short-circuits on mismatch.
fetch = fn id -> if id > 0, do: {:ok, "user-#{id}"}, else: {:error, :missing} end # => ids above zero resolve; the rest miss.
# => Each left arrow must match; the first mismatch jumps to else.
good = # => the good binding the first with returns into.
  with {:ok, name} <- fetch.(7), # => step one binds the fetched name.
       # => Later steps see earlier bindings, so the chain reads top to bottom.
       {:ok, upper} <- {:ok, String.upcase(name)} do # => step two uppercases it.
    # => The do block runs only when every step matched.
    "hello #{upper}" # => the happy-path greeting.
  else # => short-circuits land here, matched by value.
    # => else clauses match the short-circuit value, never a bare fallback.
    {:error, :missing} -> "no such user" # => the missing-user message.
    # => Unexpected shapes stay visible instead of collapsing silently.
    other -> "unexpected: #{inspect(other)}" # => the visible-unexpected branch.
  end # => the with closes; good holds one of the three strings.
# => A failing input takes the else branch with the same code shape.
bad = # => the bad binding the second with returns into.
  with {:ok, name} <- fetch.(0), # => step one fails here on zero.
       {:ok, upper} <- {:ok, String.upcase(name)} do # => step two never runs.
    "hello #{upper}" # => unreachable for the failing input.
  else # => the same else shape handles the same failure kind.
    {:error, :missing} -> "no such user" # => the identical missing message.
    other -> "unexpected: #{inspect(other)}" # => the identical fallback.
  end # => the with closes; bad holds the missing message.
# => Print both outcomes with fixed labels.
IO.puts("ok=#{good} failed=#{bad}") # => the side-by-side outcome report.
