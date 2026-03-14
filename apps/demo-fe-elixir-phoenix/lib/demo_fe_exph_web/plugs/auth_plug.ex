defmodule DemoFeExphWeb.Plugs.AuthPlug do
  @moduledoc """
  Reads authentication tokens from the session and sets socket assigns.

  Sets the following conn assigns:
  - `:current_user_token` — the access token string, or `nil`
  - `:refresh_token` — the refresh token string, or `nil`
  - `:is_authenticated` — `true` when an access token is present, otherwise `false`

  This plug does not redirect. Use `RequireAuthPlug` for redirect-on-failure behavior.
  """

  import Plug.Conn

  @behaviour Plug

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, _opts) do
    access_token = get_session(conn, :access_token)
    refresh_token = get_session(conn, :refresh_token)

    conn
    |> assign(:current_user_token, access_token)
    |> assign(:refresh_token, refresh_token)
    |> assign(:is_authenticated, not is_nil(access_token))
  end
end
