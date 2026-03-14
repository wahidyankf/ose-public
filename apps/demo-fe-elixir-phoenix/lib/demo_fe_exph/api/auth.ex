defmodule DemoFeExph.Api.Auth do
  @moduledoc "Authentication API calls: register, login, token refresh, and logout."

  alias DemoFeExph.Api.Client

  @doc "Registers a new user account."
  def register(username, email, password) do
    Client.post("/api/v1/auth/register", %{
      username: username,
      email: email,
      password: password
    })
  end

  @doc "Logs in with username and password; returns tokens on success."
  def login(username, password) do
    Client.post("/api/v1/auth/login", %{username: username, password: password})
  end

  @doc "Refreshes the access token using the given refresh token."
  def refresh_token(token) do
    Client.post("/api/v1/auth/refresh", %{refresh_token: token})
  end

  @doc "Logs out the current session using the refresh token."
  def logout(refresh_token) do
    Client.post("/api/v1/auth/logout", %{refresh_token: refresh_token})
  end

  @doc "Logs out all sessions for the authenticated user."
  def logout_all(access_token) do
    Client.post("/api/v1/auth/logout-all", %{}, access_token)
  end
end
