defmodule DemoFeExphWeb.Unit.HealthStatusSteps do
  use Cabbage.Feature, async: false, file: "health/health-status.feature"

  use DemoFeExphWeb.ConnCase

  @moduletag :unit

  setup do
    DemoFeExph.Test.ApiStub.reset()
    :ok
  end

  defgiven ~r/^the app is running$/, _vars, state do
    {:ok, state}
  end

  defwhen ~r/^the user opens the app$/, _vars, %{conn: conn} = state do
    {:ok, view, _html} = live(conn, "/")
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^an unauthenticated user opens the app$/, _vars, %{conn: conn} = state do
    {:ok, view, _html} = live(conn, "/")
    {:ok, Map.put(state, :view, view)}
  end

  defthen ~r/^the health status indicator should display "(?<status>[^"]*)"$/,
          %{status: status},
          %{view: view} = state do
    html = render(view)
    assert html =~ status
    {:ok, state}
  end

  defthen ~r/^no detailed component health information should be visible$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    refute html =~ "components"
    refute html =~ "db"
    refute html =~ "cache"
    {:ok, state}
  end
end
