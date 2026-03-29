defmodule AADemoBeExphWeb.ConnCase do
  @moduledoc """
  This module defines the test case to be used by
  tests that require setting up a connection.

  Integration tests (tagged :integration) use the in-memory store
  instead of a real database.
  """

  use ExUnit.CaseTemplate

  using do
    quote do
      @endpoint AADemoBeExphWeb.Endpoint

      use AADemoBeExphWeb, :verified_routes

      import Plug.Conn
      import Phoenix.ConnTest
      import AADemoBeExphWeb.ConnCase
    end
  end

  setup _tags do
    ADemoBeExph.Test.InMemoryStore.reset()
    {:ok, conn: Phoenix.ConnTest.build_conn()}
  end
end
