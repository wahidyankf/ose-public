# => Example 41: explicit doubles stand in for boundaries without libraries.
defmodule Rates do # => the boundary-as-argument converter.
  # => The boundary arrives as a function argument, never a global.
  def convert(amount, fetch), do: amount * fetch.("usd") # => fetch, then multiply.
end # => the module closes; convert stays injectable.
ExUnit.start(auto_run: false, seed: 0, formatters: []) # => no autorun, fixed seed, silent formatters.
# => Each test module groups facts about one unit under test.
defmodule RatesFacts do # => the facts module for fixed and capturing doubles.
  # => async false keeps the teaching suite sequential and readable.
  use ExUnit.Case, async: false # => sequential cases, fixed order.
  test "converts with a fixed double" do # => the fixed-double fact.
    assert Rates.convert(10, fn _ -> 2 end) == 20 # => 10 at rate two is 20.
  end # => the first test closes.
  test "records the requested currency" do # => the capturing-double fact.
    # => The double captures its argument through a test-process message.
    me = self() # => the test process the double reports to.
    Rates.convert(1, fn cur -> send(me, {:asked, cur}); 1 end) # => convert, capturing the currency.
    # => assert_received matches the mailbox without any sleep or wait.
    assert_received {:asked, "usd"} # => the mailbox proves usd was asked.
  end # => the second test closes.
end # => the facts module closes; two tests registered.
# => run returns the summary as data; the script prints its own fixed line.
stats = ExUnit.run() # => run silently, collect the summary map.
# => Suite lines name counts, never timings, so the transcript is stable.
IO.puts("suite: #{stats.total} tests, #{stats.failures} failures") # => the fixed summary line.
