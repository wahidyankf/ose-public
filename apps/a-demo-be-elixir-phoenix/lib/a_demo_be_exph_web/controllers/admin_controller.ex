defmodule AADemoBeExphWeb.AdminController do
  use AADemoBeExphWeb, :controller

  alias GeneratedSchemas.PasswordResetResponse
  alias GeneratedSchemas.User, as: UserSchema
  alias GeneratedSchemas.UserListResponse
  alias Guardian.Plug, as: GuardianPlug

  defp accounts, do: Application.get_env(:a_demo_be_exph, :accounts_module, ADemoBeExph.Accounts)

  defp token_ctx,
    do: Application.get_env(:a_demo_be_exph, :token_module, ADemoBeExph.Token.TokenContext)

  def list_users(conn, params) do
    current_user = GuardianPlug.current_resource(conn)

    if current_user.role != "ADMIN" do
      conn
      |> put_status(:forbidden)
      |> json(%{message: "Admin access required"})
    else
      search = Map.get(params, "search")
      raw_page = params |> Map.get("page", "1") |> String.to_integer()
      page = max(raw_page, 1)

      opts = [page: page]
      opts = if search, do: Keyword.put(opts, :email, search), else: opts

      result = accounts().list_users(opts)
      total_pages = ceil(result.total / result.page_size)

      _ = %UserListResponse{
        content: result.data,
        total_elements: result.total,
        total_pages: total_pages,
        page: result.page,
        size: result.page_size
      }

      conn
      |> json(%{
        content: Enum.map(result.data, &user_json/1),
        totalElements: result.total,
        page: result.page
      })
    end
  end

  def disable_user(conn, %{"id" => id} = params) do
    with :ok <- require_admin(conn),
         user when not is_nil(user) <- accounts().get_user(id) do
      _reason = Map.get(params, "reason", "")

      case accounts().disable_user(user) do
        {:ok, _} ->
          token_ctx().revoke_all_refresh_tokens(user.id)
          json(conn, %{message: "User disabled"})

        {:error, _} ->
          conn |> put_status(:internal_server_error) |> json(%{message: "Failed to disable user"})
      end
    else
      :forbidden ->
        conn |> put_status(:forbidden) |> json(%{message: "Admin access required"})

      nil ->
        conn |> put_status(:not_found) |> json(%{message: "User not found"})
    end
  end

  def enable_user(conn, %{"id" => id}) do
    with :ok <- require_admin(conn),
         user when not is_nil(user) <- accounts().get_user(id) do
      case accounts().enable_user(user) do
        {:ok, _} -> json(conn, %{message: "User enabled"})
        {:error, _} -> conn |> put_status(:internal_server_error) |> json(%{message: "Failed"})
      end
    else
      :forbidden -> conn |> put_status(:forbidden) |> json(%{message: "Admin access required"})
      nil -> conn |> put_status(:not_found) |> json(%{message: "User not found"})
    end
  end

  def unlock_user(conn, %{"id" => id}) do
    with :ok <- require_admin(conn),
         user when not is_nil(user) <- accounts().get_user(id) do
      case accounts().unlock_user(user) do
        {:ok, _} -> json(conn, %{message: "User unlocked"})
        {:error, _} -> conn |> put_status(:internal_server_error) |> json(%{message: "Failed"})
      end
    else
      :forbidden -> conn |> put_status(:forbidden) |> json(%{message: "Admin access required"})
      nil -> conn |> put_status(:not_found) |> json(%{message: "User not found"})
    end
  end

  def force_password_reset(conn, %{"id" => id}) do
    with :ok <- require_admin(conn),
         user when not is_nil(user) <- accounts().get_user(id) do
      reset_token = :crypto.strong_rand_bytes(24) |> Base.url_encode64(padding: false)

      _ = %PasswordResetResponse{token: reset_token}

      _ = %UserSchema{
        id: to_string(user.id),
        username: user.username,
        email: user.email,
        display_name: user.display_name || user.username,
        status: user.status,
        roles: [user.role],
        created_at: to_string(user.created_at),
        updated_at: to_string(user.updated_at)
      }

      json(conn, %{
        message: "Password reset token generated",
        token: reset_token,
        user_id: user.id
      })
    else
      :forbidden -> conn |> put_status(:forbidden) |> json(%{message: "Admin access required"})
      nil -> conn |> put_status(:not_found) |> json(%{message: "User not found"})
    end
  end

  defp require_admin(conn) do
    user = GuardianPlug.current_resource(conn)

    if user.role == "ADMIN" do
      :ok
    else
      :forbidden
    end
  end

  defp user_json(user) do
    %{
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      displayName: user.display_name || user.username
    }
  end
end
