defmodule DemoFeExphWeb.AdminLive do
  @moduledoc "LiveView for admin user management."

  use DemoFeExphWeb, :live_view

  @default_page 1
  @default_size 20

  @impl true
  def mount(_params, session, socket) do
    token = session["access_token"]
    admin = DemoFeExph.Api.admin_module()

    case admin.list_users(token, @default_page, @default_size) do
      {:ok, body} ->
        {:ok,
         assign(socket,
           token: token,
           users: body["users"] || [],
           total: body["total"] || 0,
           page: @default_page,
           size: @default_size,
           search: nil,
           error: nil
         )}

      {:error, {401, _body}} ->
        {:ok, push_navigate(socket, to: "/login")}

      {:error, _reason} ->
        {:ok,
         assign(socket,
           token: token,
           users: [],
           total: 0,
           page: @default_page,
           size: @default_size,
           search: nil,
           error: "Failed to load users."
         )}
    end
  end

  @impl true
  def handle_event("search", %{"search" => search}, socket) do
    query = if search == "", do: nil, else: search
    admin = DemoFeExph.Api.admin_module()

    case admin.list_users(socket.assigns.token, 1, socket.assigns.size, query) do
      {:ok, body} ->
        {:noreply,
         assign(socket,
           users: body["users"] || [],
           total: body["total"] || 0,
           page: 1,
           search: query,
           error: nil
         )}

      {:error, {401, _body}} ->
        {:noreply, push_navigate(socket, to: "/login")}

      {:error, _reason} ->
        {:noreply, assign(socket, error: "Failed to search users.")}
    end
  end

  def handle_event("disable_user", %{"id" => id, "reason" => reason}, socket) do
    admin = DemoFeExph.Api.admin_module()

    case admin.disable_user(socket.assigns.token, id, reason) do
      {:ok, _body} ->
        reload_users(socket)

      {:error, {401, _body}} ->
        {:noreply, push_navigate(socket, to: "/login")}

      {:error, _reason} ->
        {:noreply, assign(socket, error: "Failed to disable user.")}
    end
  end

  def handle_event("enable_user", %{"id" => id}, socket) do
    admin = DemoFeExph.Api.admin_module()

    case admin.enable_user(socket.assigns.token, id) do
      {:ok, _body} ->
        reload_users(socket)

      {:error, {401, _body}} ->
        {:noreply, push_navigate(socket, to: "/login")}

      {:error, _reason} ->
        {:noreply, assign(socket, error: "Failed to enable user.")}
    end
  end

  def handle_event("unlock_user", %{"id" => id}, socket) do
    admin = DemoFeExph.Api.admin_module()

    case admin.unlock_user(socket.assigns.token, id) do
      {:ok, _body} ->
        reload_users(socket)

      {:error, {401, _body}} ->
        {:noreply, push_navigate(socket, to: "/login")}

      {:error, _reason} ->
        {:noreply, assign(socket, error: "Failed to unlock user.")}
    end
  end

  def handle_event("force_password_reset", %{"id" => id}, socket) do
    admin = DemoFeExph.Api.admin_module()

    case admin.force_password_reset(socket.assigns.token, id) do
      {:ok, body} ->
        reset_token = body["token"] || ""
        {:noreply, assign(socket, error: nil, reset_token: reset_token)}

      {:error, {401, _body}} ->
        {:noreply, push_navigate(socket, to: "/login")}

      {:error, _reason} ->
        {:noreply, assign(socket, error: "Failed to force password reset.")}
    end
  end

  defp reload_users(socket) do
    admin = DemoFeExph.Api.admin_module()

    case admin.list_users(
           socket.assigns.token,
           socket.assigns.page,
           socket.assigns.size,
           socket.assigns.search
         ) do
      {:ok, body} ->
        {:noreply,
         assign(socket, users: body["users"] || [], total: body["total"] || 0, error: nil)}

      {:error, _reason} ->
        {:noreply, assign(socket, error: "Failed to reload users.")}
    end
  end

  @impl true
  def render(assigns) do
    assigns = assign_new(assigns, :reset_token, fn -> nil end)

    ~H"""
    <div>
      <h1>Admin — User Management</h1>
      <%= if @error do %>
        <p style="color: red;">{@error}</p>
      <% end %>
      <form phx-submit="search">
        <input type="text" name="search" placeholder="Search users" />
        <button type="submit">Search</button>
      </form>
      <p>Total: {@total}</p>
      <nav>
        <span>Page {@page}</span>
      </nav>
      <ul>
        <%= for user <- @users do %>
          <li>
            {user["username"]} — {user["status"]}
            <button phx-click="enable_user" phx-value-id={user["id"]}>Enable</button>
            <button phx-click="unlock_user" phx-value-id={user["id"]}>Unlock</button>
            <button phx-click="force_password_reset" phx-value-id={user["id"]}>
              Generate Reset Token
            </button>
          </li>
        <% end %>
      </ul>
      <%= if @reset_token && @reset_token != "" do %>
        <div>
          <p>Reset token: {@reset_token}</p>
          <button id="copy-reset-token">Copy</button>
        </div>
      <% end %>
    </div>
    """
  end
end
