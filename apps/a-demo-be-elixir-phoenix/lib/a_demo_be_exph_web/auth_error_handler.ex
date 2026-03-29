defmodule AADemoBeExphWeb.AuthErrorHandler do
  @moduledoc """
  Guardian error handler for authentication failures.
  Returns a 401 JSON response for unauthorized requests.
  """

  import Plug.Conn

  def auth_error(conn, {_type, _reason}, _opts) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(401, Jason.encode!(%{error: "Unauthorized"}))
    |> halt()
  end
end
