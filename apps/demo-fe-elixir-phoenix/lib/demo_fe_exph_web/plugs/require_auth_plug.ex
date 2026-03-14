defmodule DemoFeExphWeb.Plugs.RequireAuthPlug do
  @moduledoc """
  Enforces authentication by redirecting unauthenticated requests to /login.

  Depends on `AuthPlug` having run first so that `conn.assigns.is_authenticated`
  is set. When the user is not authenticated, this plug halts the pipeline and
  redirects to `/login` with an informational flash message.
  """

  import Plug.Conn
  import Phoenix.Controller

  @behaviour Plug

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, _opts) do
    if conn.assigns[:is_authenticated] do
      conn
    else
      conn
      |> put_flash(:error, "You must log in to access this page.")
      |> redirect(to: "/login")
      |> halt()
    end
  end
end
