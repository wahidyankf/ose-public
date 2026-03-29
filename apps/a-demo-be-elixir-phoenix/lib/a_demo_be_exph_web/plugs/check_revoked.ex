defmodule AADemoBeExphWeb.Plugs.CheckRevoked do
  @moduledoc """
  Plug that rejects requests carrying a blacklisted access token.
  Must be placed after Guardian.Plug.EnsureAuthenticated.
  """

  import Plug.Conn

  alias Guardian.Plug, as: GuardianPlug

  defp token_ctx,
    do: Application.get_env(:a_demo_be_exph, :token_module, ADemoBeExph.Token.TokenContext)

  def init(opts), do: opts

  def call(conn, _opts) do
    claims = GuardianPlug.current_claims(conn)
    jti = claims && Map.get(claims, "jti")

    if jti && token_ctx().revoked?(jti) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(401, Jason.encode!(%{error: "Token has been revoked"}))
      |> halt()
    else
      if claims do
        user_id = Map.get(claims, "sub")
        assign(conn, :current_user_id, user_id)
      else
        conn
      end
    end
  end
end
