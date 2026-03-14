defmodule DemoFeExphWeb.HealthLive do
  @moduledoc "LiveView for backend health status and navigation landing page."

  use DemoFeExphWeb, :live_view

  @impl true
  def mount(_params, session, socket) do
    is_authenticated = not is_nil(session["access_token"])
    client = DemoFeExph.Api.client_module()

    case client.get_health() do
      {:ok, body} ->
        {:ok,
         assign(socket,
           status: body["status"] || "unknown",
           is_authenticated: is_authenticated
         )}

      {:error, _reason} ->
        {:ok, assign(socket, status: "unavailable", is_authenticated: is_authenticated)}
    end
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <h1>Demo Frontend</h1>
      <p>Backend status: {@status}</p>
      <%= if @is_authenticated do %>
        <p>Logged in</p>
        <nav>
          <a href="/profile">Profile</a>
          <a href="/expenses">Expenses</a>
          <a href="/expenses/summary">Summary</a>
          <a href="/admin">Admin</a>
          <a href="/tokens">Tokens</a>
        </nav>
      <% else %>
        <nav>
          <a href="/login">Log In</a>
          <a href="/register">Register</a>
          <a href="/tokens">Tokens</a>
        </nav>
      <% end %>
    </div>
    """
  end
end
