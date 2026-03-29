defmodule AADemoBeExphWeb.HealthController do
  use AADemoBeExphWeb, :controller

  alias GeneratedSchemas.HealthResponse

  def index(conn, _params) do
    _ = %HealthResponse{status: "UP"}
    json(conn, %{status: "UP"})
  end
end
