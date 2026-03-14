defmodule DemoFeExphWeb.RegisterLive do
  @moduledoc "LiveView for the user registration page."

  use DemoFeExphWeb, :live_view

  @impl true
  def mount(_params, session, socket) do
    if session["access_token"] do
      {:ok, push_navigate(socket, to: "/")}
    else
      {:ok, assign(socket, error: nil, success: nil)}
    end
  end

  @impl true
  def handle_event(
        "register",
        %{"username" => username, "email" => email, "password" => password},
        socket
      ) do
    auth = DemoFeExph.Api.auth_module()

    case auth.register(username, email, password) do
      {:ok, _body} ->
        {:noreply, assign(socket, success: "Account created. Please log in.", error: nil)}

      {:error, {_status, body}} ->
        message = body["message"] || "Registration failed."
        {:noreply, assign(socket, error: message, success: nil)}

      {:error, _reason} ->
        {:noreply,
         assign(socket, error: "Unable to reach backend. Please try again.", success: nil)}
    end
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <h1>Register</h1>
      <%= if @error do %>
        <p style="color: red;">{@error}</p>
      <% end %>
      <%= if @success do %>
        <p style="color: green;">{@success}</p>
      <% end %>
      <form phx-submit="register">
        <input type="text" name="username" placeholder="Username" />
        <input type="email" name="email" placeholder="Email" />
        <input type="password" name="password" placeholder="Password" />
        <button type="submit">Register</button>
      </form>
      <a href="/login">Already have an account? Log in</a>
    </div>
    """
  end
end
