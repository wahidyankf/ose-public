defmodule DemoBeExphWeb.Unit.SecuritySteps do
  use Cabbage.Feature, async: false, file: "security/security.feature"

  use DemoBeExphWeb.ConnCase

  alias DemoBeExph.Integration.Helpers
  alias DemoBeExph.Test.InMemoryStore

  @moduletag :unit

  defp accounts, do: Application.get_env(:demo_be_exph, :accounts_module)

  defgiven ~r/^the API is running$/, _vars, state do
    {:ok, state}
  end

  defgiven ~r/^a user "(?<username>[^"]+)" is registered with password "(?<password>[^"]+)"$/,
           %{username: username, password: password},
           state do
    email = "#{username}@example.com"
    user = Helpers.register_user!(username, email, password)
    {:ok, Map.merge(state, %{alice: user, alice_password: password})}
  end

  defgiven ~r/^"alice" has had the maximum number of failed login attempts$/,
           _vars,
           %{alice: user} = state do
    InMemoryStore.update_state(fn s ->
      locked_user =
        Map.merge(user, %{
          status: "LOCKED",
          failed_login_attempts: 5,
          locked_at: DateTime.utc_now() |> DateTime.truncate(:second)
        })

      Map.update!(s, :users, fn users -> Map.put(users, user.id, locked_user) end)
    end)

    {:ok, state}
  end

  defgiven ~r/^a user "(?<username>[^"]+)" is registered and locked after too many failed logins$/,
           %{username: username},
           state do
    password = "Str0ng#Pass1"
    email = "#{username}@example.com"
    user = Helpers.register_user!(username, email, password)
    {:ok, _} = accounts().deactivate_user(user)

    InMemoryStore.update_state(fn s ->
      Map.update!(s, :users, fn users ->
        Map.update!(users, user.id, fn u -> Map.put(u, :status, "LOCKED") end)
      end)
    end)

    updated_user = accounts().get_user(user.id)
    {:ok, Map.merge(state, %{alice: updated_user, alice_password: password})}
  end

  defgiven ~r/^an admin user "(?<username>[^"]+)" is registered and logged in$/,
           %{username: username},
           state do
    email = "#{username}@example.com"
    password = "Str0ng#Pass1"
    user = Helpers.register_user!(username, email, password)
    admin_user = Helpers.make_admin!(user)
    {access_token, _} = Helpers.login_user!(admin_user)
    {:ok, Map.merge(state, %{admin: admin_user, admin_token: access_token})}
  end

  defgiven ~r/^an admin has unlocked alice's account$/, _vars, %{alice: alice} = state do
    accounts().unlock_user(alice)
    {:ok, state}
  end

  defwhen ~r/^the client sends POST \/api\/v1\/auth\/register with body \{ "username": "(?<username>[^"]+)", "email": "(?<email>[^"]+)", "password": "(?<password>[^"]+)" \}$/,
          %{username: username, email: email, password: password},
          state do
    body = Jason.encode!(%{username: username, email: email, password: password})

    conn =
      build_conn()
      |> put_req_header("content-type", "application/json")
      |> post("/api/v1/auth/register", body)

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^the client sends POST \/api\/v1\/auth\/login with body \{ "username": "(?<username>[^"]+)", "password": "(?<password>[^"]+)" \}$/,
          %{username: username, password: password},
          state do
    body = Jason.encode!(%{username: username, password: password})

    conn =
      build_conn()
      |> put_req_header("content-type", "application/json")
      |> post("/api/v1/auth/login", body)

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^the admin sends POST \/api\/v1\/admin\/users\/\{alice_id\}\/unlock$/,
          _vars,
          %{alice: alice, admin_token: admin_token} = state do
    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(admin_token))
      |> put_req_header("content-type", "application/json")
      |> post("/api/v1/admin/users/#{alice.id}/unlock", "{}")

    {:ok, Map.put(state, :conn, conn)}
  end

  defthen ~r/^the response status code should be (?<code>\d+)$/,
          %{code: code},
          %{conn: conn} = state do
    assert conn.status == String.to_integer(code)
    {:ok, state}
  end

  defthen ~r/^the response body should contain a validation error for "(?<field>[^"]+)"$/,
          %{field: field},
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert Map.has_key?(body, "errors")
    errors = body["errors"]
    assert Map.has_key?(errors, field)
    assert errors[field] != []
    {:ok, state}
  end

  defthen ~r/^alice's account status should be "(?<status>[^"]+)"$/,
          %{status: status},
          %{alice: alice} = state do
    updated = accounts().get_user(alice.id)
    assert String.downcase(updated.status) == String.downcase(status)
    {:ok, state}
  end

  defthen ~r/^the response body should contain a non-null "(?<field>[^"]+)" field$/,
          %{field: field},
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert Map.has_key?(body, field)
    assert body[field] != nil
    {:ok, state}
  end
end
