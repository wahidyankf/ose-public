# => Example 71: Conn Test Pins the Answer
Logger.configure(level: :warning)
# => warnings only; ExUnit stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => ExUnit runs the suite inside this script
ExUnit.start(auto_run: false, seed: 0)
# => no formatter output keeps the transcript fixed
ExUnit.configure(formatters: [])

# => one controller module owns the hello answer
defmodule Ex71.HelloController do
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
defmodule Ex71.Router do
  # => the macro that builds match and dispatch
  use Phoenix.Router

  # => GET /hello/:name reaches hello with name bound
  get("/hello/:name", Ex71.HelloController, :hello)
  # => end router: one route, one answer
end

# => one test module pins the controller answer
defmodule Ex71.RouterTest do
  # => tests run one after another here
  use ExUnit.Case, async: false

  # => the status assertion names 200 exactly
  test "hello answers 200" do
    # => a test connection, never a socket
    conn = Ex71.Router.call(Plug.Test.conn(:get, "/hello/ada"), [])
    # => the status is the assertion
    assert conn.status == 200
    # => end test: status pinned, no browser
  end

  # => the body assertion names the greeting
  test "hello greets by name" do
    # => the same request, the same dispatch
    conn = Ex71.Router.call(Plug.Test.conn(:get, "/hello/ada"), [])
    # => the body is the assertion
    assert conn.resp_body == "hello ada"
    # => end test: body pinned, no browser
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex71.Main do
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
Ex71.Main.run()
