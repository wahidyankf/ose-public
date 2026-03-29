defmodule AADemoBeExphWeb.Integration.PasswordLoginSteps do
  use Cabbage.Feature, async: false, file: "authentication/password-login.feature"

  use ADemoBeExph.DataCaseIntegration

  alias ADemoBeExph.Integration.Helpers
  alias ADemoBeExph.Integration.ServiceLayer

  @moduletag :integration

  defp accounts, do: Application.get_env(:a_demo_be_exph, :accounts_module)

  defgiven ~r/^the API is running$/, _vars, state do
    {:ok, state}
  end

  defgiven ~r/^a user "(?<username>[^"]+)" is registered with password "(?<password>[^"]+)"$/,
           %{username: username, password: password},
           state do
    email = "#{username}@example.com"
    user = Helpers.register_user!(username, email, password)
    {:ok, Map.merge(state, %{registered_user: user, alice_password: password})}
  end

  defgiven ~r/^a user "(?<username>[^"]+)" is registered and deactivated$/,
           %{username: username},
           state do
    existing_user = Map.get(state, :registered_user)
    password = Map.get(state, :alice_password, "Str0ng#Pass1")

    user =
      if existing_user && existing_user.username == username do
        existing_user
      else
        email = "#{username}@example.com"
        Helpers.register_user!(username, email, password)
      end

    accounts().deactivate_user(user)
    {:ok, state}
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

  defthen ~r/^the response body should contain a non-null "(?<field>[^"]+)" field$/,
          %{field: field},
          %{response: response} = state do
    assert Map.has_key?(response.body, field)
    assert response.body[field] != nil
    {:ok, state}
  end

  defthen ~r/^the response body should contain "(?<field>[^"]+)" equal to "(?<value>[^"]+)"$/,
          %{field: field, value: value},
          %{response: response} = state do
    assert response.body[field] == value
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
