# => Example 76: Channel Test Pins the Reply
Logger.configure(level: :warning)
# => warnings only; ExUnit stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => ExUnit runs the suite inside this script
ExUnit.start(auto_run: false, seed: 0)
# => no formatter output keeps the transcript fixed
ExUnit.configure(formatters: [])

# => one channel module owns the room topics
defmodule Ex76.RoomChannel do
  # => join and event callbacks live here
  use Phoenix.Channel

  # => room ids join freely in this lesson
  def join("room:" <> _id, _params, socket) do
    # => joins always succeed here
    {:ok, socket}
    # => end join: door always open
  end

  # => ping answers at once, nothing stored
  def handle_in("ping", _payload, socket) do
    # => the reply carries the pong straight back
    {:reply, {:ok, %{pong: true}}, socket}
    # => end event: question in, answer out
  end

  # => module boundary stays explicit
end

# => one test module pins join and reply
defmodule Ex76.RoomChannelTest do
  # => tests run one after another here
  use ExUnit.Case, async: false

  # => room 7 joins with ok
  test "join accepts room 7" do
    # => the join tuple is the assertion
    assert {:ok, _socket} = Ex76.RoomChannel.join("room:7", %{}, struct(Phoenix.Socket))
    # => end test: join pinned, no socket
  end

  # => ping answers pong on the joined channel
  test "ping answers pong" do
    # => join first, then speak
    {:ok, socket} = Ex76.RoomChannel.join("room:7", %{}, struct(Phoenix.Socket))
    # => the reply tuple is the assertion
    assert {:reply, {:ok, %{pong: true}}, _} = Ex76.RoomChannel.handle_in("ping", %{}, socket)
    # => end test: reply pinned, no socket
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex76.Main do
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
Ex76.Main.run()
