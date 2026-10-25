# => Example 2: Missing Route Raises 404
Logger.configure(level: :warning)
# => warnings only; Plug logs never reach the transcript
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one controller module owns the single known answer
defmodule Ex02.HelloController do
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
defmodule Ex02.Router do
  # => the macro that builds match and dispatch
  use Phoenix.Router

  # => exactly one known route exists
  get("/hello", Ex02.HelloController, :hello)
  # => end router: unknown paths raise instead
end

# => run/0 holds the whole example narrative
defmodule Ex02.Main do
  # => single entry point the last line calls
  def run do
    # => a request to a path nobody declared
    # => try the dispatch that cannot match
    missed =
      try do
        # => this call raises before answering
        Ex02.Router.call(Plug.Test.conn(:get, "/goodbye"), [])
        # => matched would print here, never reached
        "matched"
      rescue
        # => the miss carries its production status
        e in Phoenix.Router.NoRouteError ->
          "no route: #{e.plug_status}"
          # => end rescue: 404 without an endpoint
      end

    # => Output: no route: 404
    IO.puts(missed)
    # => a request to the known path still answers
    conn = Plug.Test.conn(:get, "/hello")
    # => dispatch finds the declared route
    conn = Ex02.Router.call(conn, [])
    # => Output: known: 200 hello
    IO.puts("known: #{conn.status} #{conn.resp_body}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex02.Main.run()
