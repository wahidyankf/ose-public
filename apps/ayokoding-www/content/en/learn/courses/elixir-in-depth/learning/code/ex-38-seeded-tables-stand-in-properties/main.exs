# => Example 38: seeded tables stand in for property libraries, deterministically.
ExUnit.start(auto_run: false, seed: 0, formatters: []) # => no autorun, fixed seed, silent formatters.
# => exsss with a fixed seed replays the same stream on every run.
:rand.seed(:exsss, {7, 42, 99}) # => pin the generator stream first.
# => Take ten integers in range from the seeded stream, once, up front.
inputs = Enum.map(1..10, fn _ -> :rand.uniform(1000) end) # => the shared fixed table.
# => Each test module groups facts about one unit under test.
defmodule SeededFacts do # => the facts module for the two properties.
  # => async false keeps the teaching suite sequential and readable.
  use ExUnit.Case, async: false # => sequential cases, fixed order.
  # => One property per test; the table above is the shared fixed input.
  test "double then halve round-trips every sampled input" do # => the round-trip property.
    for n <- unquote(inputs) do # => iterate the injected fixed table.
      assert div(n * 2, 2) == n # => every sample round-trips exactly.
    end # => the comprehension closes; all ten held.
  end # => the first test closes.
  # => Sorting twice equals sorting once, over the very same sample.
  test "sorting is idempotent over every sampled list" do # => the idempotence property.
    sample = unquote(inputs) # => bind the same table locally.
    assert Enum.sort(Enum.sort(sample)) == Enum.sort(sample) # => sort is idempotent here.
  end # => the second test closes.
end # => the facts module closes; two tests registered.
# => run returns the summary as data; the script prints its own fixed line.
stats = ExUnit.run() # => run silently, collect the summary map.
# => The checked count proves the table ran; timings never appear.
IO.puts("suite: #{stats.total} tests, #{stats.failures} failures checked=#{length(inputs)}") # => summary plus table proof.
