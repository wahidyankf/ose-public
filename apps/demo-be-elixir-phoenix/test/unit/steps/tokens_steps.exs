defmodule DemoBeExphWeb.Unit.TokensSteps do
  use Cabbage.Feature, async: false, file: "token-management/tokens.feature"

  use DemoBeExphWeb.ConnCase

  alias DemoBeExph.Integration.Helpers

  @moduletag :unit

  defp token_ctx, do: Application.get_env(:demo_be_exph, :token_module)

  defgiven ~r/^the API is running$/, _vars, state do
    {:ok, state}
  end

  defgiven ~r/^a user "(?<username>[^"]+)" is registered with password "(?<password>[^"]+)"$/,
           %{username: username, password: password},
           state do
    email = "#{username}@example.com"
    user = Helpers.register_user!(username, email, password)
    {:ok, Map.merge(state, %{alice: user})}
  end

  defgiven ~r/^"(?<username>[^"]+)" has logged in and stored the access token$/,
           %{username: _username},
           %{alice: user} = state do
    {access_token, _refresh_token} = Helpers.login_user!(user)
    {:ok, Map.put(state, :access_token, access_token)}
  end

  defgiven ~r/^alice has logged out and her access token is blacklisted$/,
           _vars,
           %{access_token: access_token} = state do
    build_conn()
    |> put_req_header("authorization", Helpers.bearer_header(access_token))
    |> post("/api/v1/auth/logout", %{})

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

  defgiven ~r/^the admin has disabled alice's account via POST \/api\/v1\/admin\/users\/\{alice_id\}\/disable$/,
           _vars,
           %{alice: alice, admin_token: admin_token} = state do
    body = Jason.encode!(%{reason: "Test deactivation"})

    build_conn()
    |> put_req_header("authorization", Helpers.bearer_header(admin_token))
    |> put_req_header("content-type", "application/json")
    |> post("/api/v1/admin/users/#{alice.id}/disable", body)

    {:ok, state}
  end

  defwhen ~r/^alice decodes her access token payload$/,
          _vars,
          %{access_token: access_token} = state do
    payload = Helpers.decode_jwt_payload(access_token)
    {:ok, Map.put(state, :token_payload, payload)}
  end

  defwhen ~r/^the client sends GET \/.well-known\/jwks.json$/, _vars, state do
    conn = get(build_conn(), "/.well-known/jwks.json")
    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^alice sends POST \/api\/v1\/auth\/logout with her access token$/,
          _vars,
          %{access_token: access_token} = state do
    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> post("/api/v1/auth/logout", %{})

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^the client sends GET \/api\/v1\/users\/me with alice's access token$/,
          _vars,
          %{access_token: access_token} = state do
    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> get("/api/v1/users/me")

    {:ok, Map.put(state, :conn, conn)}
  end

  defthen ~r/^the response status code should be (?<code>\d+)$/,
          %{code: code},
          %{conn: conn} = state do
    assert conn.status == String.to_integer(code)
    {:ok, state}
  end

  defthen ~r/^the token should contain a non-null "(?<claim>[^"]+)" claim$/,
          %{claim: claim},
          %{token_payload: payload} = state do
    assert Map.has_key?(payload, claim)
    assert payload[claim] != nil
    {:ok, state}
  end

  defthen ~r/^the response body should contain at least one key in the "(?<field>[^"]+)" array$/,
          %{field: field},
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert Map.has_key?(body, field)
    assert body[field] != []
    {:ok, state}
  end

  defthen ~r/^alice's access token should be recorded as revoked$/,
          _vars,
          %{access_token: access_token} = state do
    payload = Helpers.decode_jwt_payload(access_token)
    jti = Map.get(payload, "jti")
    assert jti != nil
    assert token_ctx().revoked?(jti)
    {:ok, state}
  end
end
