defmodule DemoBeExphWeb.AuthController do
  use DemoBeExphWeb, :controller

  alias DemoBeExph.Auth.Guardian

  defp accounts, do: Application.get_env(:demo_be_exph, :accounts_module, DemoBeExph.Accounts)

  defp token_ctx,
    do: Application.get_env(:demo_be_exph, :token_module, DemoBeExph.Token.TokenContext)

  def register(conn, params) do
    case accounts().register_user(params) do
      {:ok, user} ->
        conn
        |> put_status(:created)
        |> json(%{id: user.id, username: user.username, email: user.email})

      {:error, changeset} ->
        if username_taken?(changeset) do
          conn
          |> put_status(:conflict)
          |> json(%{message: "Username already exists"})
        else
          conn
          |> put_status(:bad_request)
          |> json(%{errors: format_errors(changeset)})
        end
    end
  end

  def login(conn, params) do
    username = Map.get(params, "username", "")
    password = Map.get(params, "password", "")

    cond do
      username == "" ->
        conn
        |> put_status(:bad_request)
        |> json(%{errors: %{username: ["can't be blank"]}})

      password == "" ->
        conn
        |> put_status(:bad_request)
        |> json(%{errors: %{password: ["can't be blank"]}})

      true ->
        do_login(conn, username, password)
    end
  end

  def logout(conn, _params) do
    token = get_bearer_token(conn)

    case Guardian.decode_and_verify(token) do
      {:ok, claims} ->
        jti = Map.get(claims, "jti")
        user_id = claims |> Map.get("sub") |> parse_user_id()
        token_ctx().revoke_access_token(jti, user_id)

      {:error, _reason} ->
        nil
    end

    json(conn, %{message: "Logged out successfully"})
  end

  def logout_all(conn, _params) do
    token = get_bearer_token(conn)

    case Guardian.decode_and_verify(token) do
      {:ok, claims} ->
        jti = Map.get(claims, "jti")
        user_id = claims |> Map.get("sub") |> parse_user_id()
        token_ctx().revoke_access_token(jti, user_id)
        token_ctx().revoke_all_refresh_tokens(user_id)

      {:error, _} ->
        nil
    end

    json(conn, %{message: "All sessions logged out"})
  end

  def refresh(conn, params) do
    raw_token = Map.get(params, "refreshToken", "")

    if raw_token == "" do
      conn
      |> put_status(:bad_request)
      |> json(%{errors: %{refreshToken: ["can't be blank"]}})
    else
      do_refresh(conn, raw_token)
    end
  end

  # Private helpers

  defp do_login(conn, username, password) do
    case accounts().authenticate_user(username, password) do
      {:ok, user} ->
        {:ok, access_token, claims} = Guardian.encode_and_sign(user)
        jti = Map.get(claims, "jti")
        {:ok, refresh_token} = token_ctx().create_refresh_token(user.id)
        _ = jti

        json(conn, %{
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenType: "Bearer"
        })

      {:error, :invalid_credentials} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{message: "Invalid credentials"})

      {:error, :account_locked} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{message: "Account is locked due to too many failed login attempts"})

      {:error, :account_deactivated} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{message: "Account has been deactivated"})
    end
  end

  defp do_refresh(conn, raw_token) do
    case token_ctx().validate_refresh_token(raw_token) do
      {:error, :token_expired} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{message: "Refresh token has expired"})

      {:error, :invalid_token} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{message: "Invalid refresh token"})

      {:ok, record} ->
        user = accounts().get_user(record.user_id)

        if is_nil(user) or user.status not in ["ACTIVE"] do
          conn
          |> put_status(:unauthorized)
          |> json(%{message: "Account has been deactivated"})
        else
          token_ctx().consume_refresh_token(raw_token)
          {:ok, access_token, _claims} = Guardian.encode_and_sign(user)
          {:ok, new_refresh_token} = token_ctx().create_refresh_token(user.id)

          json(conn, %{
            accessToken: access_token,
            refreshToken: new_refresh_token,
            tokenType: "Bearer"
          })
        end
    end
  end

  defp get_bearer_token(conn) do
    conn
    |> get_req_header("authorization")
    |> List.first("")
    |> String.replace_prefix("Bearer ", "")
  end

  defp parse_user_id(nil), do: nil
  defp parse_user_id(sub) when is_binary(sub), do: String.to_integer(sub)
  defp parse_user_id(sub) when is_integer(sub), do: sub

  defp username_taken?(%Ecto.Changeset{} = changeset) do
    changeset.errors
    |> Keyword.get_values(:username)
    |> Enum.any?(fn {_, opts} -> opts[:constraint] == :unique end)
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, _opts} -> msg end)
  end
end
