# => Kata 2 solution: the first suite pins the discount with two facts.
ExUnit.start(auto_run: false, seed: 0, formatters: []) # => manual run, fixed seed, silent formatter.
# => The function under test, unchanged from the starter, as a module.
defmodule DiscountFn do # => the module under test.
  def apply(total) when total > 100, do: div(total * 9, 10) # => large totals take ten percent off.
  def apply(total), do: total # => small totals pass through.
end # => the module closes.
# => ExUnit modules group facts; tests call the module, never a closure.
defmodule DiscountKata do # => the test module.
  use ExUnit.Case, async: false # => synchronous cases; order is fixed.
  test "discounts large totals" do # => first fact: 200 becomes 180.
    assert DiscountFn.apply(200) == 180 # => the large-total pin.
  end # => first test closes.
  test "leaves small totals alone" do # => second fact: 50 stays 50.
    assert DiscountFn.apply(50) == 50 # => the small-total pin.
  end # => second test closes.
end # => the test module closes.
# => The summary as data closes the kata: two tests, zero failures.
stats = ExUnit.run() # => run returns the summary map, prints nothing.
# => Print the fixed summary line the lesson asserts on.
IO.puts("suite: #{stats.total} tests, #{stats.failures} failures") # => suite: 2 tests, 0 failures.
