# => Example 5: Scopes Group Api Routes
Logger.configure(level: :warning)
# => warnings only; request logs never reach the transcript
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one controller module answers for one fake user
defmodule Ex05.UserController do
  # => json answers without an endpoint
  use Phoenix.Controller, formats: [:html, :json]

  # => the action the scoped route below names
  def show(conn, %{"id" => id}) do
    # => the id segment echoes inside a JSON object
    json(conn, %{id: id, name: "ada"})
    # => end show: one resource, one shape
  end

  # => module boundary stays explicit
end

# => one router module groups routes under /api
defmodule Ex05.Router do
  # => the macro that builds match and dispatch
  use Phoenix.Router

  # => every route inside shares the /api prefix
  scope "/api" do
    # => GET /api/users/:id reaches show
    get("/users/:id", Ex05.UserController, :show)
    # => end scope: prefixes compose, never repeat
  end

  # => end router: one scope, one route
end

# => run/0 holds the whole example narrative
defmodule Ex05.Main do
  # => single entry point the last line calls
  def run do
    # => a request to the scoped path
    conn = Plug.Test.conn(:get, "/api/users/7")
    # => the scope prefix matches, then the route
    conn = Ex05.Router.call(conn, [])
    # => the JSON body carries the echoed id
    {:ok, decoded} = Jason.decode(conn.resp_body)
    # => Output: user: 7 ada
    IO.puts("user: #{decoded["id"]} #{decoded["name"]}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex05.Main.run()
