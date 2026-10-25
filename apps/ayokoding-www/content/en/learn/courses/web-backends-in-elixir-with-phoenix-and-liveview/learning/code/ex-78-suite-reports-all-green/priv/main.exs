# => Example 78: Suite Reports All Green
Logger.configure(level: :warning)
# => warnings only; ExUnit stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => ExUnit runs the suite inside this script
ExUnit.start(auto_run: false, seed: 0)
# => no formatter output keeps the transcript fixed
ExUnit.configure(formatters: [])

# => one controller module owns the hello answer
defmodule Ex78.HelloController do
  # => text answers without an endpoint
  use Phoenix.Controller, formats: [:html, :json]

  # => the action the route below names
  def hello(conn, %{"name" => name}) do
    # => plain-text answer built from the path segment
    text(conn, "hello #{name}")
    # => end hello: no template, no socket
  end

  # => module boundary stays explicit
end

# => one router module owns the route table
defmodule Ex78.Router do
  # => the macro that builds match and dispatch
  use Phoenix.Router

  # => GET /hello/:name reaches hello with name bound
  get("/hello/:name", Ex78.HelloController, :hello)
  # => end router: one route, one answer
end

# => one LiveView module counts button presses
defmodule Ex78.Counter do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount starts every visitor at zero
  def mount(_params, _session, socket) do
    # => one assign holds the whole state
    {:ok, assign(socket, count: 0)}
    # => end mount: zero until the first press
  end

  # => the inc event adds exactly one
  def handle_event("inc", _params, socket) do
    # => update transforms the old count
    {:noreply, update(socket, :count, &(&1 + 1))}
    # => end event: state change, no reply
  end

  # => the template reads the count assign
  def render(assigns), do: ~H"<p>count: {@count}</p>"
  # => end view: press in, number out
end

# => one mixed suite pins all three layers
defmodule Ex78.AppTest do
  # => tests run one after another here
  use ExUnit.Case, async: false

  # => the web layer answers its greeting
  test "router greets ada" do
    # => dispatch the greeting in-process
    conn = Ex78.Router.call(Plug.Test.conn(:get, "/hello/ada"), [])
    # => status and body are the assertions
    assert conn.status == 200
    # => the greeting names the visitor
    assert conn.resp_body == "hello ada"
    # => end test: controller pinned
  end

  # => the live layer counts its presses
  test "counter reaches two" do
    # => mount first, so the count assign exists
    {:ok, socket} = Ex78.Counter.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => two presses in a row
    {:noreply, one} = Ex78.Counter.handle_event("inc", %{}, socket)
    # => the second press sees the first
    {:noreply, two} = Ex78.Counter.handle_event("inc", %{}, one)
    # => the count is the assertion
    assert two.assigns.count == 2
    # => end test: LiveView pinned
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex78.Main do
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
Ex78.Main.run()
