defmodule AADemoBeExphWeb.Unit.HealthSteps do
  use Cabbage.Feature, async: false, file: "health/health-check.feature"

  use AADemoBeExphWeb.ConnCase

  @moduletag :unit

  defgiven ~r/^the API is running$/, _vars, state do
    {:ok, state}
  end

  defwhen ~r/^an operations engineer sends GET \/health$/, _vars, state do
    conn = get(build_conn(), "/health")
    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^an unauthenticated engineer sends GET \/health$/, _vars, state do
    conn = get(build_conn(), "/health")
    {:ok, Map.put(state, :conn, conn)}
  end

  defthen ~r/^the response status code should be (?<code>\d+)$/,
          %{code: code},
          %{conn: conn} = state do
    assert conn.status == String.to_integer(code)
    {:ok, state}
  end

  defthen ~r/^the health status should be "UP"$/, _vars, %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert body["status"] == "UP"
    {:ok, state}
  end

  defthen ~r/^the response should not include detailed component health information$/,
          _vars,
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert map_size(body) == 1
    assert Map.has_key?(body, "status")
    {:ok, state}
  end
end
