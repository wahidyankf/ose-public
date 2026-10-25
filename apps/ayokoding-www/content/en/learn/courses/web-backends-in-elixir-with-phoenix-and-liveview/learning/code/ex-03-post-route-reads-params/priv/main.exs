# => Example 3: Post Route Reads Params
Logger.configure(level: :warning)
# => warnings only; request logs never reach the transcript
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one controller module echoes the posted message
defmodule Ex03.EchoController do
  # => text answers without an endpoint
  use Phoenix.Controller, formats: [:html, :json]

  # => the action the POST route below names
  def echo(conn, params) do
    # => the msg param comes from the request line
    text(conn, "echo #{params["msg"]}")
    # => end echo: POST body or query both land in params
  end

  # => module boundary stays explicit
end

# => one router module owns the POST route
defmodule Ex03.Router do
  # => the macro that builds match and dispatch
  use Phoenix.Router

  # => POST /echo reaches echo, GET would miss
  post("/echo", Ex03.EchoController, :echo)
  # => end router: method is part of the match
end

# => run/0 holds the whole example narrative
defmodule Ex03.Main do
  # => single entry point the last line calls
  def run do
    # => a POST carrying its message on the request line
    conn = Plug.Test.conn(:post, "/echo?msg=hi")
    # => pipelines fetch the query string into params
    conn = Plug.Conn.fetch_query_params(conn)
    # => the router dispatches by method and path
    conn = Ex03.Router.call(conn, [])
    # => Output: post: 200 echo hi
    IO.puts("post: #{conn.status} #{conn.resp_body}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex03.Main.run()
