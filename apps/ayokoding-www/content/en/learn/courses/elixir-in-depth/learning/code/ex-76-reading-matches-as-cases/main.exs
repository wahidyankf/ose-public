# => Example 76: read matches as exhaustive cases over the value's shape.
defmodule Classifier do # => the five-input case-table module.
  # => Each clause is one case; order runs top to bottom, first match wins.
  def kind({:ok, _}), do: "success" # => the ok case.
  def kind({:error, :missing}), do: "known failure" # => the known-failure case.
  def kind({:error, _}), do: "other failure" # => the other-failure case.
  def kind(nil), do: "absence" # => the absence case.
  def kind(_), do: "unclassified" # => the documented-remainder case.
end # => the module closes; the table is now callable.
# => Five inputs exercise four clauses plus the wildcard.
inputs = [{:ok, 1}, {:error, :missing}, {:error, :boom}, nil, 42] # => the fixed five-case input.
# => Sorting the kinds keeps the report independent of input order.
kinds = Enum.map(inputs, &Classifier.kind/1) |> Enum.sort() # => classify, then sort.
# => Print the sorted classifications with a fixed label.
IO.puts("kinds=#{inspect(kinds)}") # => the sorted decision table.
