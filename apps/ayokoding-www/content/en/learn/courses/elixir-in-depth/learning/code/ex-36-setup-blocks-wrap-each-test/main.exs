# => Example 36: setup blocks wrap each test in a shared, explicit context.
ExUnit.start(auto_run: false, seed: 0, formatters: []) # => no autorun, fixed seed, silent formatters.
# => Each test module groups facts about one unit under test.
defmodule RosterFacts do # => the facts module for the users map.
  # => async false keeps the teaching suite sequential and readable.
  use ExUnit.Case, async: false # => sequential cases, fixed order.
  # => setup runs before each test and merges its keys into the context.
  setup do # => build the shared fixture once per test.
    {:ok, users: %{"ada" => 36, "grace" => 85}} # => the two-user fixture.
  end # => the setup block closes; context carries users.
  # => Each test pattern-matches the context keys it needs, nothing more.
  test "finds ada", %{users: users} do # => the lookup fact with context.
    assert Map.fetch!(users, "ada") == 36 # => ada is 36 in the fixture.
  end # => the first test closes.
  # => A second test reuses the same context without rebuilding it.
  test "counts two users", %{users: users} do # => the count fact with context.
    assert map_size(users) == 2 # => exactly two users, no more.
  end # => the second test closes.
end # => the facts module closes; two tests registered.
# => run returns the summary as data; the script prints its own fixed line.
stats = ExUnit.run() # => run silently, collect the summary map.
# => Suite lines name counts, never timings, so the transcript is stable.
IO.puts("suite: #{stats.total} tests, #{stats.failures} failures") # => the fixed summary line.
