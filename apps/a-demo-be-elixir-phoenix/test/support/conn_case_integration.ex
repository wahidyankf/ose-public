defmodule AADemoBeExphWeb.ConnCaseIntegration do
  @moduledoc """
  Test case for integration tests that run against a real PostgreSQL database.

  Used by tests in the :integration Mix environment (docker-compose based).
  Sets up an Ecto SQL sandbox around each test so changes are rolled back.
  """

  use ExUnit.CaseTemplate

  using do
    quote do
      @endpoint AADemoBeExphWeb.Endpoint

      use AADemoBeExphWeb, :verified_routes

      import Plug.Conn
      import Phoenix.ConnTest
      import AADemoBeExphWeb.ConnCaseIntegration
    end
  end

  setup _tags do
    pid = Ecto.Adapters.SQL.Sandbox.start_owner!(ADemoBeExph.Repo, shared: true)
    on_exit(fn -> Ecto.Adapters.SQL.Sandbox.stop_owner(pid) end)
    {:ok, conn: Phoenix.ConnTest.build_conn()}
  end
end
