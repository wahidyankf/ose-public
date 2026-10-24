# => Example 26: a module names the unit; clauses split behavior by shape.
defmodule Checkout do # => the cart-totalling unit module.
  # => @moduledoc states the contract in one sentence for readers.
  @moduledoc "Totals a cart with one discount rule per clause." # => the contract sentence.
  # => Function clauses match in order; guards refine without nesting.
  def total(items) when is_list(items), do: Enum.sum(items) # => the list-shaped clause.
  def total(%{items: items}), do: total(items) # => the map-shaped clause delegates.
  # => @doc documents the public entry; private helpers stay undocumented.
  @doc "Applies the member discount to totals over one hundred." # => the discount contract.
  def member(total) when total > 100, do: total * 0.9 # => the discount clause for big totals.
  def member(total), do: total # => the pass-through clause for the rest.
  # => defp hides the helper; only the public surface is tested.
  defp round2(x) when is_float(x), do: Float.round(x, 2) # => round floats to cents.
  defp round2(x), do: x # => leave integers untouched.
  def checkout(cart), do: cart |> total() |> member() |> round2() # => the composed rule pipeline.
end # => the module closes; Checkout is now callable.
# => Public functions run through the module alias; privates stay hidden.
IO.puts("list=#{Checkout.total([10, 20])} map=#{Checkout.total(%{items: [10, 20]})}") # => both shapes total 30.
# => The pipeline reads as the business rule: total, discount, round.
IO.puts("member=#{Checkout.checkout([60, 60])} plain=#{Checkout.checkout([10, 20])}") # => discounted and plain totals.
