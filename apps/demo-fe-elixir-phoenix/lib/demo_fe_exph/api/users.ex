defmodule DemoFeExph.Api.Users do
  @moduledoc "User profile API calls: fetch, update, password change, and deactivation."

  alias DemoFeExph.Api.Client

  @doc "Fetches the current authenticated user's profile."
  def get_current_user(token) do
    Client.get("/api/v1/users/me", token)
  end

  @doc "Updates the current user's display name."
  def update_profile(token, display_name) do
    Client.patch("/api/v1/users/me", %{display_name: display_name}, token)
  end

  @doc "Changes the current user's password."
  def change_password(token, old_password, new_password) do
    Client.post(
      "/api/v1/users/me/change-password",
      %{old_password: old_password, new_password: new_password},
      token
    )
  end

  @doc "Deactivates the current user's account."
  def deactivate_account(token) do
    Client.post("/api/v1/users/me/deactivate", %{}, token)
  end
end
