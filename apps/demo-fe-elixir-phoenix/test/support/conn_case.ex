defmodule DemoFeExphWeb.ConnCase do
  @moduledoc """
  Test case for LiveView unit tests.

  All API calls are mocked via process dictionary stubs set up in each step
  file. The endpoint is started in server: false mode so no real HTTP port
  is bound.
  """

  use ExUnit.CaseTemplate

  using do
    quote do
      @endpoint DemoFeExphWeb.Endpoint

      import Plug.Conn
      import Phoenix.ConnTest
      import Phoenix.LiveViewTest
      import DemoFeExphWeb.ConnCase

      use DemoFeExphWeb, :verified_routes
    end
  end

  setup _tags do
    {:ok, conn: Phoenix.ConnTest.build_conn()}
  end
end
