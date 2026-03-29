defmodule AADemoBeExphWeb.Integration.TokensSteps do
  use Cabbage.Feature, async: false, file: "token-management/tokens.feature"

  use ADemoBeExph.DataCaseIntegration

  alias ADemoBeExph.Integration.Helpers
  alias ADemoBeExph.Integration.ServiceLayer

  @moduletag :integration

  defp token_ctx, do: Application.get_env(:a_demo_be_exph, :token_module)

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
    ServiceLayer.logout(access_token)
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
    ServiceLayer.admin_disable_user(admin_token, alice.id, "Test deactivation")
    {:ok, state}
  end

  defwhen ~r/^alice decodes her access token payload$/,
          _vars,
          %{access_token: access_token} = state do
    payload = Helpers.decode_jwt_payload(access_token)
    {:ok, Map.put(state, :token_payload, payload)}
  end

  defwhen ~r/^the client sends GET \/.well-known\/jwks.json$/, _vars, state do
    response = ServiceLayer.get_jwks()
    {:ok, Map.put(state, :response, response)}
  end

  defwhen ~r/^alice sends POST \/api\/v1\/auth\/logout with her access token$/,
          _vars,
          %{access_token: access_token} = state do
    response = ServiceLayer.logout(access_token)
    {:ok, Map.put(state, :response, response)}
  end

  defwhen ~r/^the client sends GET \/api\/v1\/users\/me with alice's access token$/,
          _vars,
          %{access_token: access_token} = state do
    response = ServiceLayer.get_me(access_token)
    {:ok, Map.put(state, :response, response)}
  end

  defthen ~r/^the response status code should be (?<code>\d+)$/,
          %{code: code},
          %{response: response} = state do
    assert response.status == String.to_integer(code)
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
          %{response: response} = state do
    assert Map.has_key?(response.body, field)
    assert response.body[field] != []
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
