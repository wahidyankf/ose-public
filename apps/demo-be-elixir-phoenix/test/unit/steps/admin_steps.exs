defmodule DemoBeExphWeb.Unit.AdminSteps do
  use Cabbage.Feature, async: false, file: "admin/admin.feature"

  use DemoBeExphWeb.ConnCase

  alias DemoBeExph.Integration.Helpers

  @moduletag :unit

  defp accounts, do: Application.get_env(:demo_be_exph, :accounts_module)

  defgiven ~r/^the API is running$/, _vars, state do
    {:ok, state}
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

  defgiven ~r/^users "(?<u1>[^"]+)", "(?<u2>[^"]+)", and "(?<u3>[^"]+)" are registered$/,
           %{u1: u1, u2: u2, u3: u3},
           state do
    alice = Helpers.register_user!(u1, "#{u1}@example.com", "Str0ng#Pass1")
    Helpers.register_user!(u2, "#{u2}@example.com", "Str0ng#Pass1")
    Helpers.register_user!(u3, "#{u3}@example.com", "Str0ng#Pass1")
    {:ok, Map.put(state, :alice, alice)}
  end

  defgiven ~r/^"alice" has logged in and stored the access token$/,
           _vars,
           %{alice: alice} = state do
    {access_token, _} = Helpers.login_user!(alice)
    {:ok, Map.put(state, :alice_token, access_token)}
  end

  defgiven ~r/^alice's account has been disabled by the admin$/,
           _vars,
           %{alice: alice, admin_token: admin_token} = state do
    body = Jason.encode!(%{reason: "Policy violation"})

    build_conn()
    |> put_req_header("authorization", Helpers.bearer_header(admin_token))
    |> put_req_header("content-type", "application/json")
    |> post("/api/v1/admin/users/#{alice.id}/disable", body)

    {:ok, state}
  end

  defgiven ~r/^alice's account has been disabled$/, _vars, %{alice: alice} = state do
    accounts().deactivate_user(alice)
    {:ok, state}
  end

  defwhen ~r/^the admin sends GET \/api\/v1\/admin\/users$/,
          _vars,
          %{admin_token: admin_token} = state do
    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(admin_token))
      |> get("/api/v1/admin/users")

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^the admin sends GET \/api\/v1\/admin\/users\?email=(?<email>[^\s]+)$/,
          %{email: email},
          %{admin_token: admin_token} = state do
    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(admin_token))
      |> get("/api/v1/admin/users?email=#{email}")

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^the admin sends POST \/api\/v1\/admin\/users\/\{alice_id\}\/disable with body \{ "reason": "(?<reason>[^"]+)" \}$/,
          %{reason: reason},
          %{alice: alice, admin_token: admin_token} = state do
    body = Jason.encode!(%{reason: reason})

    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(admin_token))
      |> put_req_header("content-type", "application/json")
      |> post("/api/v1/admin/users/#{alice.id}/disable", body)

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^the client sends GET \/api\/v1\/users\/me with alice's access token$/,
          _vars,
          %{alice_token: alice_token} = state do
    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(alice_token))
      |> get("/api/v1/users/me")

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^the admin sends POST \/api\/v1\/admin\/users\/\{alice_id\}\/enable$/,
          _vars,
          %{alice: alice, admin_token: admin_token} = state do
    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(admin_token))
      |> put_req_header("content-type", "application/json")
      |> post("/api/v1/admin/users/#{alice.id}/enable", "{}")

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^the admin sends POST \/api\/v1\/admin\/users\/\{alice_id\}\/force-password-reset$/,
          _vars,
          %{alice: alice, admin_token: admin_token} = state do
    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(admin_token))
      |> put_req_header("content-type", "application/json")
      |> post("/api/v1/admin/users/#{alice.id}/force-password-reset", "{}")

    {:ok, Map.put(state, :conn, conn)}
  end

  defthen ~r/^the response status code should be (?<code>\d+)$/,
          %{code: code},
          %{conn: conn} = state do
    assert conn.status == String.to_integer(code)
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

  defthen ~r/^the response body should contain at least one user with "(?<field>[^"]+)" equal to "(?<value>[^"]+)"$/,
          %{field: field, value: value},
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    users = body["data"]
    assert Enum.any?(users, fn u -> u[field] == value end)
    {:ok, state}
  end

  defthen ~r/^alice's account status should be "(?<status>[^"]+)"$/,
          %{status: status},
          %{alice: alice} = state do
    updated = accounts().get_user(alice.id)
    assert String.downcase(updated.status) == String.downcase(status)
    {:ok, state}
  end
end
