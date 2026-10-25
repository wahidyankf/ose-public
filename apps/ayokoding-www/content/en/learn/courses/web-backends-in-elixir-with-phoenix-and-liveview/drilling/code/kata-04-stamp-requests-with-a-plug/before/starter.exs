# => Kata 4 starter: controller without its plug
Logger.configure(level: :warning)
# => warnings only; request logs never reach the transcript
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one controller module reads a missing stamp
defmodule Kata04.HelloController do
  # => text answers without an endpoint
  use Phoenix.Controller, formats: [:html, :json]

  # => the action reads what no plug wrote
  def hello(conn, _params) do
    # => MISSING: RequestIdPlug before the router
    text(conn, "hello #{conn.assigns[:request_id]}")
    # => end hello: nil rides into the answer
  end

  # => module boundary stays explicit
end

# => one router module owns the hello route
defmodule Kata04.Router do
  # => the macro that builds match and dispatch
  use Phoenix.Router

  # => GET /hello reaches hello unstamped
  get("/hello", Kata04.HelloController, :hello)
  # => end router: routing without preparation
end

# => run/0 shows the unstamped answer
defmodule Kata04.Main do
  # => single entry point the last line calls
  def run do
    # => dispatch with no plug in front
    conn = Kata04.Router.call(Plug.Test.conn(:get, "/hello"), [])
    # => the missing stamp leaves a bare greeting
    bare = conn.resp_body == "hello "
    # => Output: stamped: false
    IO.puts("stamped: #{not bare}")

    # => end run: add the plug, then route
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata04.Main.run()
