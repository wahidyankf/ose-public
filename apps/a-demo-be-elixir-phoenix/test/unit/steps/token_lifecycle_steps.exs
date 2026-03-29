defmodule AADemoBeExphWeb.Unit.TokenLifecycleSteps do
  use Cabbage.Feature, async: false, file: "authentication/token-lifecycle.feature"

  use AADemoBeExphWeb.ConnCase

  alias ADemoBeExph.Integration.Helpers

  @moduletag :unit

  defp accounts, do: Application.get_env(:a_demo_be_exph, :accounts_module)
  defp token_ctx, do: Application.get_env(:a_demo_be_exph, :token_module)

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

  defgiven ~r/^"(?<username>[^"]+)" has logged in and stored the access token and refresh token$/,
           %{username: _username},
           %{alice: user} = state do
    {access_token, refresh_token} = Helpers.login_user!(user)
    {:ok, Map.merge(state, %{access_token: access_token, refresh_token: refresh_token})}
  end

  defgiven ~r/^alice's refresh token has expired$/,
           _vars,
           %{refresh_token: refresh_token} = state do
    token_ctx().expire_refresh_token!(refresh_token)
    {:ok, state}
  end

  defgiven ~r/^alice has used her refresh token to get a new token pair$/,
           _vars,
           %{alice: user, refresh_token: refresh_token} = state do
    token_ctx().consume_refresh_token(refresh_token)
    {:ok, new_refresh_token} = token_ctx().create_refresh_token(user.id)
    {:ok, Map.put(state, :new_refresh_token, new_refresh_token)}
  end

  defgiven ~r/^the user "(?<username>[^"]+)" has been deactivated$/,
           %{username: _username},
           %{alice: user} = state do
    accounts().deactivate_user(user)
    {:ok, state}
  end

  defgiven ~r/^alice has already logged out once$/,
           _vars,
           %{alice: _user, access_token: access_token} = state do
    build_conn()
    |> put_req_header("authorization", "Bearer #{access_token}")
    |> post("/api/v1/auth/logout", %{})

    {:ok, state}
  end

  defwhen ~r/^alice sends POST \/api\/v1\/auth\/refresh with her refresh token$/,
          _vars,
          %{refresh_token: refresh_token} = state do
    body = Jason.encode!(%{"refreshToken" => refresh_token})

    conn =
      build_conn()
      |> put_req_header("content-type", "application/json")
      |> post("/api/v1/auth/refresh", body)

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^alice sends POST \/api\/v1\/auth\/refresh with her original refresh token$/,
          _vars,
          %{refresh_token: refresh_token} = state do
    body = Jason.encode!(%{"refreshToken" => refresh_token})

    conn =
      build_conn()
      |> put_req_header("content-type", "application/json")
      |> post("/api/v1/auth/refresh", body)

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^alice sends POST \/api\/v1\/auth\/logout with her access token$/,
          _vars,
          %{access_token: access_token} = state do
    conn =
      build_conn()
      |> put_req_header("authorization", "Bearer #{access_token}")
      |> post("/api/v1/auth/logout", %{})

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^alice sends POST \/api\/v1\/auth\/logout-all with her access token$/,
          _vars,
          %{access_token: access_token} = state do
    conn =
      build_conn()
      |> put_req_header("authorization", "Bearer #{access_token}")
      |> post("/api/v1/auth/logout-all", %{})

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

  defthen ~r/^the response body should contain an error message about token expiration$/,
          _vars,
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert body["message"] =~ ~r/[Ee]xpir/i
    {:ok, state}
  end

  defthen ~r/^the response body should contain an error message about invalid token$/,
          _vars,
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert body["message"] =~ ~r/[Ii]nvalid/i
    {:ok, state}
  end

  defthen ~r/^the response body should contain an error message about account deactivation$/,
          _vars,
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert body["message"] =~ ~r/[Dd]eactivat|[Ii]nactive|[Dd]isabled/i
    {:ok, state}
  end

  defthen ~r/^alice's access token should be invalidated$/,
          _vars,
          %{access_token: access_token} = state do
    conn =
      build_conn()
      |> put_req_header("authorization", "Bearer #{access_token}")
      |> get("/api/v1/users/me")

    assert conn.status == 401
    {:ok, state}
  end
end
