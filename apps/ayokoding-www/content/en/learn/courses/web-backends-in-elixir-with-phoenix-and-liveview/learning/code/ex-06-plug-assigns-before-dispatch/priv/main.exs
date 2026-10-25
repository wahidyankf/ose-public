# => Example 6: Plug Assigns Before Dispatch
Logger.configure(level: :warning)
# => warnings only; request logs never reach the transcript
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one plug module stamps every request it sees
defmodule Ex06.RequestIdPlug do
  # => assign and header helpers live here
  import Plug.Conn

  # => plugs receive their options through init
  def init(opts), do: opts

  # => the stamp lands in assigns for later readers
  def call(conn, _opts), do: assign(conn, :request_id, "req-1")
  # => end plug: transform, then pass along
end

# => one controller module reads the stamp back
defmodule Ex06.HelloController do
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
defmodule Ex06.Router do
  # => the macro that builds match and dispatch
  use Phoenix.Router

  # => GET /hello reaches hello after the plug
  get("/hello", Ex06.HelloController, :hello)
  # => end router: routing is the last step
end

# => run/0 holds the whole example narrative
defmodule Ex06.Main do
  # => single entry point the last line calls
  def run do
    # => a plain request with no stamp yet
    conn = Plug.Test.conn(:get, "/hello")
    # => the plug runs before the router sees it
    conn = Ex06.RequestIdPlug.call(conn, [])
    # => dispatch finds the route with assigns ready
    conn = Ex06.Router.call(conn, [])
    # => Output: stamped: hello req-1
    IO.puts("stamped: #{conn.resp_body}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex06.Main.run()
