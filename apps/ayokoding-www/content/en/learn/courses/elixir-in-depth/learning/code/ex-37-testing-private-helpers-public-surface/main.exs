# => Example 37: private helpers stay private; suites pin the public surface.
defmodule Discount do # => the checkout unit with hidden helpers.
  # => checkout is the one public entry the suite is allowed to call.
  def checkout(cart), do: cart |> total() |> member() # => the composed public entry.
  # => defp hides the total; tests reach it only through checkout.
  defp total(items), do: Enum.sum(items) # => the hidden summation helper.
  # => Integer division keeps the discount exact, no floats involved.
  defp member(t) when t > 100, do: t * 9 |> div(10) # => the hidden discount helper.
  defp member(t), do: t # => the hidden pass-through clause.
end # => the module closes; privates stay uncalled directly.
ExUnit.start(auto_run: false, seed: 0, formatters: []) # => no autorun, fixed seed, silent formatters.
# => Each test module groups facts about one unit under test.
defmodule DiscountFacts do # => the facts module for the checkout entry.
  # => async false keeps the teaching suite sequential and readable.
  use ExUnit.Case, async: false # => sequential cases, fixed order.
  # => Large carts discount through the public entry, privates uncalled.
  test "large carts discount through the public entry" do # => the discount fact.
    assert Discount.checkout([60, 60]) == 108 # => 120 discounts to 108.
  end # => the first test closes.
  # => Small carts pass through unchanged, same entry, same guarantee.
  test "small carts pass through unchanged" do # => the unchanged fact.
    assert Discount.checkout([10, 20]) == 30 # => 30 passes through intact.
  end # => the second test closes.
end # => the facts module closes; two tests registered.
# => run returns the summary as data; the script prints its own fixed line.
stats = ExUnit.run() # => run silently, collect the summary map.
# => Suite lines name counts, never timings, so the transcript is stable.
IO.puts("suite: #{stats.total} tests, #{stats.failures} failures") # => the fixed summary line.
