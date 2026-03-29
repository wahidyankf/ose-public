defmodule AADemoBeExphWeb.CorsPlug do
  @moduledoc """
  Plug that adds CORS headers for allowed origins.
  Handles OPTIONS preflight requests and sets Access-Control-Allow-* headers.
  """

  import Plug.Conn

  @allowed_origins ["http://localhost:3200", "http://localhost:3000", "http://localhost:3301"]

  def init(opts), do: opts

  def call(conn, _opts) do
    origin = conn |> get_req_header("origin") |> List.first()

    conn =
      if origin in @allowed_origins do
        conn
        |> put_resp_header("access-control-allow-origin", origin)
        |> put_resp_header("access-control-allow-methods", "GET, POST, PUT, DELETE, OPTIONS")
        |> put_resp_header("access-control-allow-headers", "authorization, content-type")
      else
        conn
      end

    if conn.method == "OPTIONS" do
      conn |> send_resp(200, "") |> halt()
    else
      conn
    end
  end
end
