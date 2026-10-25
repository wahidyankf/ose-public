# => Example 74: Mount Test Pins Assigns
Logger.configure(level: :warning)
# => warnings only; ExUnit stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => ExUnit runs the suite inside this script
ExUnit.start(auto_run: false, seed: 0)
# => no formatter output keeps the transcript fixed
ExUnit.configure(formatters: [])

# => one LiveView module counts button presses
defmodule Ex74.Counter do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount starts every visitor at zero
  def mount(_params, _session, socket) do
    # => one assign holds the whole state
    {:ok, assign(socket, count: 0)}
    # => end mount: zero until the first press
  end

  # => the template reads the count assign
  def render(assigns), do: ~H"<p>count: {@count}</p>"
  # => end view: mount first, render after
end

# => one test module pins the mount assigns
defmodule Ex74.CounterTest do
  # => tests run one after another here
  use ExUnit.Case, async: false

  # => mount answers ok with a socket
  test "mount answers ok" do
    # => mount with no params and no session
    assert {:ok, _socket} = Ex74.Counter.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => end test: ok pinned, no browser
  end

  # => the count assign starts at zero
  test "count starts at zero" do
    # => mount first, so the count assign exists
    {:ok, socket} = Ex74.Counter.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => the assign is the assertion
    assert socket.assigns.count == 0
    # => end test: first state pinned
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex74.Main do
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
Ex74.Main.run()
