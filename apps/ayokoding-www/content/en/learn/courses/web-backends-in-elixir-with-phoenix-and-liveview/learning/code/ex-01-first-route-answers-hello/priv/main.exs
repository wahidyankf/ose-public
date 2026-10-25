# => Example 1: First Route Answers Hello
Logger.configure(level: :warning)
# => warnings only; request logs never reach the transcript
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one controller module owns the hello answer
defmodule Ex01.HelloController do
  # => text and json answers without an endpoint
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
defmodule Ex01.Router do
  # => the macro that builds match and dispatch
  use Phoenix.Router

  # => GET /hello/:name reaches hello with name bound
  get("/hello/:name", Ex01.HelloController, :hello)
  # => end router: one route, one answer
end

# => run/0 holds the whole example narrative
defmodule Ex01.Main do
  # => single entry point the last line calls
  def run do
    # => a test connection, never a socket
    conn = Plug.Test.conn(:get, "/hello/ada")
    # => the route table dispatches it in-process
    conn = Ex01.Router.call(conn, [])
    # => Output: status: 200 body: hello ada
    IO.puts("status: #{conn.status} body: #{conn.resp_body}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex01.Main.run()
