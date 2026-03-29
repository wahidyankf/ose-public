defmodule AADemoBeExphWeb.Integration.HealthSteps do
  use Cabbage.Feature, async: false, file: "health/health-check.feature"

  use ADemoBeExph.DataCaseIntegration

  alias ADemoBeExph.Integration.ServiceLayer

  @moduletag :integration

  defgiven ~r/^the API is running$/, _vars, state do
    {:ok, state}
  end

  defwhen ~r/^an operations engineer sends GET \/health$/, _vars, state do
    response = ServiceLayer.get_health()
    {:ok, Map.put(state, :response, response)}
  end

  defwhen ~r/^an unauthenticated engineer sends GET \/health$/, _vars, state do
    response = ServiceLayer.get_health()
    {:ok, Map.put(state, :response, response)}
  end

  defthen ~r/^the response status code should be (?<code>\d+)$/,
          %{code: code},
          %{response: response} = state do
    assert response.status == String.to_integer(code)
    {:ok, state}
  end

  defthen ~r/^the health status should be "UP"$/, _vars, %{response: response} = state do
    assert response.body["status"] == "UP"
    {:ok, state}
  end

  defthen ~r/^the response should not include detailed component health information$/,
          _vars,
          %{response: response} = state do
    assert map_size(response.body) == 1
    assert Map.has_key?(response.body, "status")
    {:ok, state}
  end
end
