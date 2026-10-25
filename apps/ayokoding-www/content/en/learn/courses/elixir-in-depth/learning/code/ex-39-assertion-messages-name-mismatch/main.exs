# => Example 39: assertion messages name the mismatch for the next reader.
ExUnit.start(auto_run: false, seed: 0, formatters: []) # => no autorun, fixed seed, silent formatters.
# => Each test module groups facts about one unit under test.
defmodule ReportFacts do # => the facts module for receipt and error shapes.
  # => async false keeps the teaching suite sequential and readable.
  use ExUnit.Case, async: false # => sequential cases, fixed order.
  test "sum matches the receipt" do # => the receipt-total fact.
    total = Enum.sum([19, 23]) # => add the two receipt lines.
    # => The message names the expected receipt line on failure.
    assert total == 42, "receipt total should be 42, got #{total}" # => message names the expectation.
  end # => the first test closes.
  test "error tuple carries the missing name" do # => the error-shape fact.
    result = {:error, {:unknown_user, "alan"}} # => the fixed error value.
    # => assert with match pins the shape and binds the context in one move.
    assert {:error, {:unknown_user, name}} = result # => match pins shape, binds name.
    assert name == "alan" # => the bound name is the missing one.
  end # => the second test closes.
end # => the facts module closes; two tests registered.
# => run returns the summary as data; the script prints its own fixed line.
stats = ExUnit.run() # => run silently, collect the summary map.
# => Suite lines name counts, never timings, so the transcript is stable.
IO.puts("suite: #{stats.total} tests, #{stats.failures} failures") # => the fixed summary line.
