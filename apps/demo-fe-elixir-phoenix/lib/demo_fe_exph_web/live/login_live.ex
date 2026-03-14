defmodule DemoFeExphWeb.LoginLive do
  @moduledoc "LiveView for the login page."

  use DemoFeExphWeb, :live_view

  @impl true
  def mount(_params, session, socket) do
    if session["access_token"] do
      {:ok, push_navigate(socket, to: "/")}
    else
      {:ok, assign(socket, error: nil)}
    end
  end

  @impl true
  def handle_event("login", %{"username" => username, "password" => password}, socket) do
    auth = DemoFeExph.Api.auth_module()

    case auth.login(username, password) do
      {:ok, body} ->
        access_token = body["access_token"]
        refresh_token = body["refresh_token"]

        {:noreply,
         socket
         |> assign(:access_token, access_token)
         |> assign(:refresh_token, refresh_token)
         |> push_navigate(to: "/")}

      {:error, {_status, body}} ->
        message = body["message"] || "Invalid credentials."
        {:noreply, assign(socket, error: message)}

      {:error, _reason} ->
        {:noreply, assign(socket, error: "Unable to reach backend. Please try again.")}
    end
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <h1>Login</h1>
      <%= if @error do %>
        <p style="color: red;" role="alert">{@error}</p>
      <% end %>
      <form phx-submit="login">
        <input type="text" name="username" placeholder="Username" />
        <input type="password" name="password" placeholder="Password" />
        <button type="submit">Log In</button>
      </form>
    </div>
    """
  end
end
