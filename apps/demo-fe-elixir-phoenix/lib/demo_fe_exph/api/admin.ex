defmodule DemoFeExph.Api.Admin do
  @moduledoc "Admin API calls for user management operations."

  alias DemoFeExph.Api.Client

  @doc "Lists users with optional pagination and search."
  def list_users(token, page \\ 1, size \\ 20, search \\ nil) do
    query =
      %{page: page, size: size}
      |> maybe_put_search(search)
      |> URI.encode_query()

    Client.get("/api/v1/admin/users?#{query}", token)
  end

  @doc "Disables a user account with a reason."
  def disable_user(token, id, reason) do
    Client.post("/api/v1/admin/users/#{id}/disable", %{reason: reason}, token)
  end

  @doc "Re-enables a previously disabled user account."
  def enable_user(token, id) do
    Client.post("/api/v1/admin/users/#{id}/enable", %{}, token)
  end

  @doc "Unlocks a locked user account."
  def unlock_user(token, id) do
    Client.post("/api/v1/admin/users/#{id}/unlock", %{}, token)
  end

  @doc "Forces a password reset for the specified user."
  def force_password_reset(token, id) do
    Client.post("/api/v1/admin/users/#{id}/force-password-reset", %{}, token)
  end

  defp maybe_put_search(params, nil), do: params
  defp maybe_put_search(params, search), do: Map.put(params, :search, search)
end
