# => Example 8: Controller Answers Json
Logger.configure(level: :warning)
# => warnings only; request logs never reach the transcript
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one controller module answers with a JSON object
defmodule Ex08.StatusController do
  # => json answers without an endpoint
  use Phoenix.Controller, formats: [:html, :json]

  # => the action the route below names
  def status(conn, _params) do
    # => the map encodes through the Jason library
    json(conn, %{service: "orders", ok: true})
    # => end status: data out, no template
  end

  # => module boundary stays explicit
end

# => one router module owns the status route
defmodule Ex08.Router do
  # => the macro that builds match and dispatch
  use Phoenix.Router

  # => GET /status reaches status
  get("/status", Ex08.StatusController, :status)
  # => end router: health checks are routes too
end

# => run/0 holds the whole example narrative
defmodule Ex08.Main do
  # => single entry point the last line calls
  def run do
    # => a request to the status route
    conn = Plug.Test.conn(:get, "/status")
    # => the router dispatches to the JSON action
    conn = Ex08.Router.call(conn, [])
    # => the content type names JSON explicitly
    [ctype] = Plug.Conn.get_resp_header(conn, "content-type")
    # => Output: ctype: application/json
    IO.puts("ctype: #{String.split(ctype, ";") |> hd()}")
    # => the body decodes back to the sent fields
    {:ok, decoded} = Jason.decode(conn.resp_body)
    # => Output: json: orders true
    IO.puts("json: #{decoded["service"]} #{decoded["ok"]}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex08.Main.run()
