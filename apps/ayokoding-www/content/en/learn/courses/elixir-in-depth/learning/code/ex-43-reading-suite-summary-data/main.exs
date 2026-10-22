# => Example 43: the suite summary is data the script can gate on.
ExUnit.start(auto_run: false, seed: 0, formatters: []) # => no autorun, fixed seed, silent formatters.
# => Each test module groups facts about one unit under test.
defmodule TinyFacts do # => the two-fact facts module.
  # => async false keeps the teaching suite sequential and readable.
  use ExUnit.Case, async: false # => sequential cases, fixed order.
  test "one fact", do: assert(1 + 1 == 2) # => arithmetic holds.
  test "another fact", do: assert(:ok == :ok) # => atoms match themselves.
end # => the facts module closes; two tests registered.
# => run returns total, failures, excluded, and skipped counts as a map.
stats = ExUnit.run() # => run silently, collect the summary map.
# => Gate downstream work on the counts instead of eyeballing output.
IO.puts("total=#{stats.total} failures=#{stats.failures} excluded=#{stats.excluded} skipped=#{stats.skipped}") # => the four-count gate line.
