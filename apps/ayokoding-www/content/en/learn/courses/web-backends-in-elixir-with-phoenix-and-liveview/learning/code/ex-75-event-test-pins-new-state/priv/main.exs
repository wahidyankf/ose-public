# => Example 75: Event Test Pins New State
Logger.configure(level: :warning)
# => warnings only; ExUnit stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => ExUnit runs the suite inside this script
ExUnit.start(auto_run: false, seed: 0)
# => no formatter output keeps the transcript fixed
ExUnit.configure(formatters: [])

# => one LiveView module picks one of three tabs
defmodule Ex75.Tabs do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount selects the first tab for everyone
  def mount(_params, _session, socket) do
    # => the tab assign names the visible panel
    {:ok, assign(socket, tab: "orders")}
    # => end mount: orders until the visitor chooses
  end

  # => the select event carries the tab value
  def handle_event("select", %{"tab" => tab}, socket) do
    # => the payload decides the next state
    {:noreply, assign(socket, tab: tab)}
    # => end event: value in, tab out
  end

  # => the template reads the tab assign
  def render(assigns), do: ~H"<p>tab: {@tab}</p>"
  # => end view: value in, panel out
end

# => one test module pins the event transitions
defmodule Ex75.TabsTest do
  # => tests run one after another here
  use ExUnit.Case, async: false

  # => the default tab is orders
  test "mount selects orders" do
    # => mount first, so the tab assign exists
    {:ok, socket} = Ex75.Tabs.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => the default is the assertion
    assert socket.assigns.tab == "orders"
    # => end test: first state pinned
  end

  # => the select event switches the tab
  test "select switches to payments" do
    # => mount first, then send the event
    {:ok, socket} = Ex75.Tabs.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => the event answers noreply with a socket
    assert {:noreply, next} = Ex75.Tabs.handle_event("select", %{"tab" => "payments"}, socket)
    # => the new tab is the assertion
    assert next.assigns.tab == "payments"
    # => end test: transition pinned, no browser
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex75.Main do
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
Ex75.Main.run()
