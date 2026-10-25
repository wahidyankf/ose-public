# => Example 72: Router Test Pins the Miss
Logger.configure(level: :warning)
# => warnings only; ExUnit stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => ExUnit runs the suite inside this script
ExUnit.start(auto_run: false, seed: 0)
# => no formatter output keeps the transcript fixed
ExUnit.configure(formatters: [])

# => one controller module owns the single known answer
defmodule Ex72.HelloController do
  # => text answers without an endpoint
  use Phoenix.Controller, formats: [:html, :json]

  # => the only action this router exposes
  def hello(conn, _params) do
    # => plain-text answer for the known path
    text(conn, "hello")
    # => end hello: nothing else matches
  end

  # => module boundary stays explicit
end

# => one router module owns the small route table
defmodule Ex72.Router do
  # => the macro that builds match and dispatch
  use Phoenix.Router

  # => exactly one known route exists
  get("/hello", Ex72.HelloController, :hello)
  # => end router: unknown paths raise instead
end

# => one test module pins both outcomes
defmodule Ex72.RouterTest do
  # => tests run one after another here
  use ExUnit.Case, async: false

  # => the known path still answers 200
  test "hello answers 200" do
    # => a request to the declared route
    conn = Ex72.Router.call(Plug.Test.conn(:get, "/hello"), [])
    # => the status is the assertion
    assert conn.status == 200
    # => end test: known route pinned
  end

  # => the miss carries plug_status 404
  test "unknown path raises 404" do
    # => the miss raises instead of answering
    assert_raise Phoenix.Router.NoRouteError, fn ->
      # => no route matches this path
      Ex72.Router.call(Plug.Test.conn(:get, "/goodbye"), [])
      # => end call: the raise is the assertion
    end

    # => end test: miss pinned, no browser
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex72.Main do
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
Ex72.Main.run()
