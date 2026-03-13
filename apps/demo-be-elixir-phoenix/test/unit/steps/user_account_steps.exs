defmodule DemoBeExphWeb.Unit.UserAccountSteps do
  use Cabbage.Feature, async: false, file: "user-lifecycle/user-account.feature"

  use DemoBeExphWeb.ConnCase

  alias DemoBeExph.Integration.Helpers

  @moduletag :unit

  defgiven ~r/^the API is running$/, _vars, state do
    {:ok, state}
  end

  defgiven ~r/^a user "(?<username>[^"]+)" is registered with email "(?<email>[^"]+)" and password "(?<password>[^"]+)"$/,
           %{username: username, email: email, password: password},
           state do
    user = Helpers.register_user!(username, email, password)
    {:ok, Map.merge(state, %{alice: user, alice_email: email, alice_password: password})}
  end

  defgiven ~r/^"(?<username>[^"]+)" has logged in and stored the access token$/,
           %{username: _username},
           %{alice: user} = state do
    {access_token, _refresh_token} = Helpers.login_user!(user)
    {:ok, Map.put(state, :access_token, access_token)}
  end

  defgiven ~r/^alice has deactivated her own account via POST \/api\/v1\/users\/me\/deactivate$/,
           _vars,
           %{access_token: access_token} = state do
    build_conn()
    |> put_req_header("authorization", Helpers.bearer_header(access_token))
    |> put_req_header("content-type", "application/json")
    |> post("/api/v1/users/me/deactivate", "{}")

    {:ok, state}
  end

  defwhen ~r/^alice sends GET \/api\/v1\/users\/me$/,
          _vars,
          %{access_token: access_token} = state do
    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> get("/api/v1/users/me")

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^alice sends PATCH \/api\/v1\/users\/me with body \{ "display_name": "(?<display_name>[^"]+)" \}$/,
          %{display_name: display_name},
          %{access_token: access_token} = state do
    body = Jason.encode!(%{display_name: display_name})

    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> put_req_header("content-type", "application/json")
      |> patch("/api/v1/users/me", body)

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^alice sends POST \/api\/v1\/users\/me\/password with body \{ "old_password": "(?<old_password>[^"]+)", "new_password": "(?<new_password>[^"]+)" \}$/,
          %{old_password: old_password, new_password: new_password},
          %{access_token: access_token} = state do
    body = Jason.encode!(%{old_password: old_password, new_password: new_password})

    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> put_req_header("content-type", "application/json")
      |> post("/api/v1/users/me/password", body)

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^alice sends POST \/api\/v1\/users\/me\/deactivate$/,
          _vars,
          %{access_token: access_token} = state do
    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> put_req_header("content-type", "application/json")
      |> post("/api/v1/users/me/deactivate", "{}")

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

  defthen ~r/^the response status code should be (?<code>\d+)$/,
          %{code: code},
          %{conn: conn} = state do
    assert conn.status == String.to_integer(code)
    {:ok, state}
  end

  defthen ~r/^the response body should contain "(?<field>[^"]+)" equal to "(?<value>[^"]+)"$/,
          %{field: field, value: value},
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert body[field] == value
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

  defthen ~r/^the response body should contain an error message about invalid credentials$/,
          _vars,
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert body["message"] =~ ~r/[Ii]nvalid|[Cc]redential/i
    {:ok, state}
  end

  defthen ~r/^the response body should contain an error message about account deactivation$/,
          _vars,
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert body["message"] =~ ~r/[Dd]eactivat|[Ii]nactive|[Dd]isabled/i
    {:ok, state}
  end
end
