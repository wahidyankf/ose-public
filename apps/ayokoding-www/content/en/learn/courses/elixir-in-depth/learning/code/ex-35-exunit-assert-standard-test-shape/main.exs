# => Example 35: ExUnit tests are modules; assertions read as sentences.
ExUnit.start(auto_run: false, seed: 0, formatters: []) # => no autorun, fixed seed, silent formatters.
# => Each test module groups facts about one unit under test.
defmodule CheckoutFacts do # => the facts module for the discount rules.
  # => async false keeps the teaching suite sequential and readable.
  use ExUnit.Case, async: false # => sequential cases, fixed order.
  # => test names state the fact; assert checks it without ceremony.
  test "member discount divides exactly over one hundred" do # => the discount fact.
    assert div(120 * 9, 10) == 108 # => integer math, no float noise.
  end # => the first test closes.
  # => refute states the negative fact the suite also pins.
  test "small carts stay under the discount line" do # => the no-discount fact.
    refute Enum.sum([10, 20]) > 100 # => 30 stays under the line.
  end # => the second test closes.
end # => the facts module closes; two tests registered.
# => run returns the summary as data; the script prints its own fixed line.
stats = ExUnit.run() # => run silently, collect the summary map.
# => Suite lines name counts, never timings, so the transcript is stable.
IO.puts("suite: #{stats.total} tests, #{stats.failures} failures") # => the fixed summary line.
