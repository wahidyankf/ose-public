# => Example 77: PubSub Test Pins Delivery
Logger.configure(level: :warning)
# => warnings only; ExUnit stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => ExUnit runs the suite inside this script
ExUnit.start(auto_run: false, seed: 0)
# => no formatter output keeps the transcript fixed
ExUnit.configure(formatters: [])

# => one test module pins the broadcast delivery
defmodule Ex77.BusTest do
  # => tests run one after another here
  use ExUnit.Case, async: false

  # => one tree owns the bus for every test
  setup_all do
    # => the bus starts once for the whole module
    {:ok, _} = Supervisor.start_link([{Phoenix.PubSub, name: Ex77.Bus}], strategy: :one_for_one)
    # => setup shares nothing else
    :ok
    # => end setup: bus ready, tests proceed
  end

  # => the broadcast lands in the subscriber mailbox
  test "broadcast reaches subscribers" do
    # => this test process listens on orders
    Phoenix.PubSub.subscribe(Ex77.Bus, "orders")
    # => the broadcast names order 101
    Phoenix.PubSub.broadcast(Ex77.Bus, "orders", {:created, 101})
    # => the mailbox assertion names the message
    assert_received {:created, 101}
    # => end test: delivery pinned, no socket
  end

  # => the skipped sender hears nothing
  test "broadcast_from skips the sender" do
    # => this test process listens on the room
    Phoenix.PubSub.subscribe(Ex77.Bus, "room:7")
    # => broadcast_from skips this very process
    Phoenix.PubSub.broadcast_from(Ex77.Bus, self(), "room:7", {:shout, "hi"})
    # => the mailbox stays empty for the sender
    refute_received {:shout, _}
    # => end test: skip pinned, no socket
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex77.Main do
  # => single entry point the last line calls
  def run do
    # => the suite output stays captured and discarded
    _output = ExUnit.CaptureIO.capture_io(fn -> send(self(), {:result, ExUnit.run()}) end)
    # => the result map carries the only printed numbers
    receive do
      # => Output: tests: 2 failures: 0
      {:result, result} ->
        IO.puts("tests: #{result.total} failures: #{result.failures}")
        # => end receive: two tests, zero failures
    end

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex77.Main.run()
