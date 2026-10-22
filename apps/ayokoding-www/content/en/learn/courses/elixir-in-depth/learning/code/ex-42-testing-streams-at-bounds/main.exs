# => Example 42: streams prove their bounds; empties and infinities included.
ExUnit.start(auto_run: false, seed: 0, formatters: []) # => no autorun, fixed seed, silent formatters.
# => Each test module groups facts about one unit under test.
defmodule StreamFacts do # => the facts module for stream bounds.
  # => async false keeps the teaching suite sequential and readable.
  use ExUnit.Case, async: false # => sequential cases, fixed order.
  test "empty stream maps to empty" do # => the empty-bound fact.
    assert Stream.map([], fn x -> x end) |> Enum.to_list() == [] # => empty in, empty out.
  end # => the first test closes.
  test "take stops the infinite stream exactly at the bound" do # => the take-bound fact.
    assert Stream.iterate(1, &(&1 + 1)) |> Enum.take(3) == [1, 2, 3] # => three pulled, rest never run.
  end # => the second test closes.
  test "first element anchors the mapped range stream" do # => the anchor fact.
    assert 1..3 |> Stream.map(fn x -> x * 2 end) |> Enum.at(0) == 2 # => first mapped element is 2.
  end # => the third test closes.
end # => the facts module closes; three tests registered.
# => run returns the summary as data; the script prints its own fixed line.
stats = ExUnit.run() # => run silently, collect the summary map.
# => Suite lines name counts, never timings, so the transcript is stable.
IO.puts("suite: #{stats.total} tests, #{stats.failures} failures") # => the fixed summary line.
