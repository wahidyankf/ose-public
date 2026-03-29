defmodule AADemoBeExphWeb.Integration.UserAccountSteps do
  use Cabbage.Feature, async: false, file: "user-lifecycle/user-account.feature"

  use ADemoBeExph.DataCaseIntegration

  alias ADemoBeExph.Integration.Helpers
  alias ADemoBeExph.Integration.ServiceLayer

  @moduletag :integration

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
    ServiceLayer.deactivate_me(access_token)
    {:ok, state}
  end

  defwhen ~r/^alice sends GET \/api\/v1\/users\/me$/,
          _vars,
          %{access_token: access_token} = state do
    response = ServiceLayer.get_me(access_token)
    {:ok, Map.put(state, :response, response)}
  end

  defwhen ~r/^alice sends PATCH \/api\/v1\/users\/me with body \{ "displayName": "(?<displayName>[^"]+)" \}$/,
          %{displayName: displayName},
          %{access_token: access_token} = state do
    response = ServiceLayer.update_me(access_token, %{"displayName" => displayName})
    {:ok, Map.put(state, :response, response)}
  end

  defwhen ~r/^alice sends POST \/api\/v1\/users\/me\/password with body \{ "oldPassword": "(?<oldPassword>[^"]+)", "newPassword": "(?<newPassword>[^"]+)" \}$/,
          %{oldPassword: oldPassword, newPassword: newPassword},
          %{access_token: access_token} = state do
    response = ServiceLayer.change_password(access_token, oldPassword, newPassword)
    {:ok, Map.put(state, :response, response)}
  end

  defwhen ~r/^alice sends POST \/api\/v1\/users\/me\/deactivate$/,
          _vars,
          %{access_token: access_token} = state do
    response = ServiceLayer.deactivate_me(access_token)
    {:ok, Map.put(state, :response, response)}
  end

  defwhen ~r/^the client sends POST \/api\/v1\/auth\/login with body \{ "username": "(?<username>[^"]+)", "password": "(?<password>[^"]+)" \}$/,
          %{username: username, password: password},
          state do
    response = ServiceLayer.login(%{"username" => username, "password" => password})
    {:ok, Map.put(state, :response, response)}
  end

  defthen ~r/^the response status code should be (?<code>\d+)$/,
          %{code: code},
          %{response: response} = state do
    assert response.status == String.to_integer(code)
    {:ok, state}
  end

  defthen ~r/^the response body should contain "(?<field>[^"]+)" equal to "(?<value>[^"]+)"$/,
          %{field: field, value: value},
          %{response: response} = state do
    assert response.body[field] == value
    {:ok, state}
  end

  defthen ~r/^the response body should contain a non-null "(?<field>[^"]+)" field$/,
          %{field: field},
          %{response: response} = state do
    assert Map.has_key?(response.body, field)
    assert response.body[field] != nil
    {:ok, state}
  end

  defthen ~r/^the response body should contain an error message about invalid credentials$/,
          _vars,
          %{response: response} = state do
    assert response.body["message"] =~ ~r/[Ii]nvalid|[Cc]redential/i
    {:ok, state}
  end

  defthen ~r/^the response body should contain an error message about account deactivation$/,
          _vars,
          %{response: response} = state do
    assert response.body["message"] =~ ~r/[Dd]eactivat|[Ii]nactive|[Dd]isabled/i
    {:ok, state}
  end
end
