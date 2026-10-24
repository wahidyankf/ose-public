# => Example 40: tags select tests; names organize the rest.
ExUnit.start(auto_run: false, seed: 0, formatters: []) # => no autorun, fixed seed, silent formatters.
# => Each test module groups facts about one unit under test.
defmodule TaggedFacts do # => the facts module for tags and names.
  # => async false keeps the teaching suite sequential and readable.
  use ExUnit.Case, async: false # => sequential cases, fixed order.
  # => external marks the fact that needs the outside world; exclude skips it.
  @tag :external # => the outside-world tag.
  test "quotes the exchange rate table" do # => the external fact.
    assert %{"usd" => 1.0}["usd"] == 1.0 # => the canned rate holds.
  end # => the external test closes.
  # => A valued tag parameterizes shared setup through the test context.
  @tag rate: 2 # => the doubling-rate tag value.
  test "doubles at the tagged rate", %{rate: rate} do # => the tagged-rate fact.
    assert 21 * rate == 42 # => 21 doubles to 42 at rate two.
  end # => the tagged test closes.
  # => The untagged fact runs in every selection without any annotation.
  test "plain fact runs in every selection" do # => the always-run fact.
    assert Enum.sum([20, 22]) == 42 # => 20 plus 22 is 42.
  end # => the plain test closes.
end # => the facts module closes; three tests registered.
# => run returns the summary as data; the script prints its own fixed line.
stats = ExUnit.run() # => run silently, collect the summary map.
# => Three tests ran unfiltered here; selections happen at the mix test line.
IO.puts("suite: #{stats.total} tests, #{stats.failures} failures") # => the fixed summary line.
