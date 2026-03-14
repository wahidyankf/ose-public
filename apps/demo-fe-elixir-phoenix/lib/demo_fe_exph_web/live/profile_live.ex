defmodule DemoFeExphWeb.ProfileLive do
  @moduledoc "LiveView for the user profile management page."

  use DemoFeExphWeb, :live_view

  @impl true
  def mount(_params, session, socket) do
    token = session["access_token"]
    users = DemoFeExph.Api.users_module()

    case users.get_current_user(token) do
      {:ok, user} ->
        {:ok,
         assign(socket,
           token: token,
           refresh_token: session["refresh_token"],
           user: user,
           error: nil,
           success: nil
         )}

      {:error, {status, _body}} when status in [401, 403] ->
        {:ok, push_navigate(socket, to: "/login")}

      {:error, _reason} ->
        {:ok,
         assign(socket,
           token: token,
           refresh_token: session["refresh_token"],
           user: nil,
           error: "Failed to load profile.",
           success: nil
         )}
    end
  end

  @impl true
  def handle_event("update_profile", %{"display_name" => display_name}, socket) do
    users = DemoFeExph.Api.users_module()

    case users.update_profile(socket.assigns.token, display_name) do
      {:ok, user} ->
        {:noreply, assign(socket, user: user, success: "Profile updated.", error: nil)}

      {:error, {401, _body}} ->
        {:noreply, push_navigate(socket, to: "/login")}

      {:error, _reason} ->
        {:noreply, assign(socket, error: "Failed to update profile.", success: nil)}
    end
  end

  def handle_event(
        "change_password",
        %{"old_password" => old_password, "new_password" => new_password},
        socket
      ) do
    users = DemoFeExph.Api.users_module()

    case users.change_password(socket.assigns.token, old_password, new_password) do
      {:ok, _body} ->
        {:noreply, assign(socket, success: "Password changed.", error: nil)}

      {:error, {401, _body}} ->
        {:noreply, push_navigate(socket, to: "/login")}

      {:error, {_status, body}} ->
        message = body["message"] || "Failed to change password."
        {:noreply, assign(socket, error: message, success: nil)}

      {:error, _reason} ->
        {:noreply, assign(socket, error: "Failed to change password.", success: nil)}
    end
  end

  def handle_event("deactivate", _params, socket) do
    users = DemoFeExph.Api.users_module()

    case users.deactivate_account(socket.assigns.token) do
      {:ok, _body} ->
        {:noreply, push_navigate(socket, to: "/login")}

      {:error, {401, _body}} ->
        {:noreply, push_navigate(socket, to: "/login")}

      {:error, _reason} ->
        {:noreply, assign(socket, error: "Failed to deactivate account.", success: nil)}
    end
  end

  def handle_event("logout", _params, socket) do
    refresh_token = socket.assigns.refresh_token
    auth = DemoFeExph.Api.auth_module()

    if refresh_token do
      auth.logout(refresh_token)
    end

    {:noreply, push_navigate(socket, to: "/login")}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <h1>Profile</h1>
      <%= if @error do %>
        <p style="color: red;">{@error}</p>
      <% end %>
      <%= if @success do %>
        <p style="color: green;">{@success}</p>
      <% end %>
      <%= if @user do %>
        <p>Username: {@user["username"]}</p>
        <p>Email: {@user["email"]}</p>
        <p>Display name: {@user["display_name"]}</p>
        <form phx-submit="update_profile">
          <input type="text" name="display_name" placeholder="New display name" />
          <button type="submit">Update Profile</button>
        </form>
        <form phx-submit="change_password">
          <input type="password" name="old_password" placeholder="Current password" />
          <input type="password" name="new_password" placeholder="New password" />
          <button type="submit">Change Password</button>
        </form>
        <button phx-click="deactivate">Deactivate Account</button>
        <button phx-click="logout">Log Out</button>
      <% end %>
    </div>
    """
  end
end
