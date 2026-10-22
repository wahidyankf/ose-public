# => Example 14: error values for expected failures keep control flow flat.
lookup = fn users, name -> # => the lookup function both reports share.
  # => Map.fetch returns :ok or :error tuples instead of raising on absence.
  case Map.fetch(users, name) do # => match the fetch result shape.
    # => The found value wraps in :ok so callers match instead of branching.
    {:ok, age} -> {:ok, age} # => pass the found age through as ok.
    # => Missing keys are expected, so :error carries the name for context.
    :error -> {:error, {:unknown_user, name}} # => the context-carrying error.
  end # => the case closes; the tuple shape is now uniform.
end # => the lookup function closes.
# => A fixed map stands in for any store; absence is data, not disaster.
users = %{"ada" => 36, "grace" => 85} # => the fixed store fixture.
# => Matching on the tuple keeps both outcomes at the same indent level.
report = fn result -> # => the report function rendering either shape.
  case result do # => match the lookup result shape.
    {:ok, age} -> "age=#{age}" # => found renders the age line.
    {:error, {:unknown_user, name}} -> "unknown=#{name}" # => missing renders the name line.
  end # => the case closes; one string comes out either way.
end # => the report function closes.
# => Print the found and missing reports with fixed labels.
IO.puts("found=#{report.(lookup.(users, "ada"))} missing=#{report.(lookup.(users, "alan"))}") # => the side-by-side report.
