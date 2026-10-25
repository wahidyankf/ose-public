# => Kata 4 solution: plug stamps, controller reads
Logger.configure(level: :warning)
# => warnings only; request logs never reach the transcript
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one plug module stamps every request it sees
defmodule Kata04s.RequestIdPlug do
  # => assign helpers live here
  import Plug.Conn

  # => plugs receive their options through init
  def init(opts), do: opts

  # => the stamp lands in assigns for later readers
  def call(conn, _opts), do: assign(conn, :request_id, "req-1")
  # => end plug: transform, then pass along
end

# => one controller module reads the stamp back
defmodule Kata04s.HelloController do
  # => text answers without an endpoint
  use Phoenix.Controller, formats: [:html, :json]

  # => the action the route below names
  def hello(conn, _params) do
    # => the plug ran first, so the assign exists
    text(conn, "hello #{conn.assigns[:request_id]}")
    # => end hello: plugs prepare, actions answer
  end

  # => module boundary stays explicit
end

# => one router module owns the hello route
defmodule Kata04s.Router do
  # => the macro that builds match and dispatch
  use Phoenix.Router

  # => GET /hello reaches hello after the plug
  get("/hello", Kata04s.HelloController, :hello)
  # => end router: routing is the last step
end

# => run/0 stamps, then routes, then prints
defmodule Kata04s.Main do
  # => single entry point the last line calls
  def run do
    # => the plug runs before the router sees it
    conn =
      Plug.Test.conn(:get, "/hello") |> Kata04s.RequestIdPlug.call([]) |> Kata04s.Router.call([])

    # => Output: stamped: hello req-1
    IO.puts("stamped: #{conn.resp_body}")

    # => end run: preparation before dispatch
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata04s.Main.run()
