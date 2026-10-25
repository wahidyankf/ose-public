# => Example 4: Query Params Shape the Answer
Logger.configure(level: :warning)
# => warnings only; request logs never reach the transcript
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one controller module lists one fake search page
defmodule Ex04.SearchController do
  # => text answers without an endpoint
  use Phoenix.Controller, formats: [:html, :json]

  # => the action the search route below names
  def search(conn, params) do
    # => two query values with a default page
    text(conn, "q=#{params["q"]} page=#{params["page"] || "1"}")
    # => end search: missing keys fall back loudly
  end

  # => module boundary stays explicit
end

# => one router module owns the search route
defmodule Ex04.Router do
  # => the macro that builds match and dispatch
  use Phoenix.Router

  # => GET /search reaches search with the query intact
  get("/search", Ex04.SearchController, :search)
  # => end router: the query string is not in the match
end

# => run/0 holds the whole example narrative
defmodule Ex04.Main do
  # => single entry point the last line calls
  def run do
    # => a search with both query values present
    conn = Plug.Test.conn(:get, "/search?q=phoenix&page=2")
    # => pipelines fetch the query string into params
    conn = Plug.Conn.fetch_query_params(conn)
    # => the router dispatches, the query rides along
    conn = Ex04.Router.call(conn, [])
    # => Output: full: q=phoenix page=2
    IO.puts("full: #{conn.resp_body}")
    # => a search that omits the page entirely
    conn = Plug.Test.conn(:get, "/search?q=liveview")
    # => the same fetch step runs again
    conn = Plug.Conn.fetch_query_params(conn)
    # => the router dispatches the same route
    conn = Ex04.Router.call(conn, [])
    # => Output: default: q=liveview page=1
    IO.puts("default: #{conn.resp_body}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex04.Main.run()
