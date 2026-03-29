defmodule AADemoBeExphWeb.UserController do
  use AADemoBeExphWeb, :controller

  alias GeneratedSchemas.User, as: UserSchema
  alias Guardian.Plug, as: GuardianPlug

  defp accounts, do: Application.get_env(:a_demo_be_exph, :accounts_module, ADemoBeExph.Accounts)

  def me(conn, _params) do
    user = GuardianPlug.current_resource(conn)

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
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name || user.username,
      role: user.role,
      status: user.status
    })
  end

  def update_me(conn, params) do
    user = GuardianPlug.current_resource(conn)
    attrs = remap_update_params(params)

    case accounts().update_user(user, attrs) do
      {:ok, updated_user} ->
        _ = %UserSchema{
          id: to_string(updated_user.id),
          username: updated_user.username,
          email: updated_user.email,
          display_name: updated_user.display_name || updated_user.username,
          status: updated_user.status,
          roles: [updated_user.role],
          created_at: to_string(updated_user.created_at),
          updated_at: to_string(updated_user.updated_at)
        }

        json(conn, %{
          id: updated_user.id,
          username: updated_user.username,
          email: updated_user.email,
          displayName: updated_user.display_name || updated_user.username
        })

      {:error, changeset} ->
        conn
        |> put_status(:bad_request)
        |> json(%{errors: format_errors(changeset)})
    end
  end

  def change_password(conn, params) do
    user = GuardianPlug.current_resource(conn)
    old_password = Map.get(params, "oldPassword", "")
    new_password = Map.get(params, "newPassword", "")

    case accounts().change_password(user, old_password, new_password) do
      {:ok, _user} ->
        json(conn, %{message: "Password changed successfully"})

      {:error, :invalid_credentials} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{message: "Invalid credentials"})

      {:error, changeset} ->
        conn
        |> put_status(:bad_request)
        |> json(%{errors: format_errors(changeset)})
    end
  end

  def deactivate(conn, _params) do
    user = GuardianPlug.current_resource(conn)

    case accounts().deactivate_user(user) do
      {:ok, _user} ->
        json(conn, %{message: "Account deactivated successfully"})

      {:error, changeset} ->
        conn
        |> put_status(:bad_request)
        |> json(%{errors: format_errors(changeset)})
    end
  end

  defp remap_update_params(params) do
    params
    |> then(fn p ->
      case Map.pop(p, "displayName") do
        {nil, p} -> p
        {val, p} -> Map.put(p, "display_name", val)
      end
    end)
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, _opts} -> msg end)
  end
end
