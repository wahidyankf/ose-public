defmodule AADemoBeExphWeb.Integration.SecuritySteps do
  use Cabbage.Feature, async: false, file: "security/security.feature"

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
    {:ok, Map.merge(state, %{alice: user, alice_password: password})}
  end

  defgiven ~r/^"alice" has had the maximum number of failed login attempts$/,
           _vars,
           %{alice: user} = state do
    Enum.reduce_while(1..5, user, fn _attempt, _acc ->
      case accounts().authenticate_user(user.username, "wrong_#{System.unique_integer()}") do
        {:error, :account_locked} -> {:halt, :locked}
        _ -> {:cont, user}
      end
    end)

    {:ok, state}
  end

  defgiven ~r/^a user "(?<username>[^"]+)" is registered and locked after too many failed logins$/,
           %{username: username},
           state do
    password = "Str0ng#Pass1"
    email = "#{username}@example.com"
    user = Helpers.register_user!(username, email, password)

    Enum.reduce_while(1..5, user, fn _attempt, _acc ->
      case accounts().authenticate_user(user.username, "wrong_#{System.unique_integer()}") do
        {:error, :account_locked} -> {:halt, :locked}
        _ -> {:cont, user}
      end
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
    response =
      ServiceLayer.register(%{"username" => username, "email" => email, "password" => password})

    {:ok, Map.put(state, :response, response)}
  end

  defwhen ~r/^the client sends POST \/api\/v1\/auth\/login with body \{ "username": "(?<username>[^"]+)", "password": "(?<password>[^"]+)" \}$/,
          %{username: username, password: password},
          state do
    response = ServiceLayer.login(%{"username" => username, "password" => password})
    {:ok, Map.put(state, :response, response)}
  end

  defwhen ~r/^the admin sends POST \/api\/v1\/admin\/users\/\{alice_id\}\/unlock$/,
          _vars,
          %{alice: alice, admin_token: admin_token} = state do
    response = ServiceLayer.admin_unlock_user(admin_token, alice.id)
    {:ok, Map.put(state, :response, response)}
  end

  defthen ~r/^the response status code should be (?<code>\d+)$/,
          %{code: code},
          %{response: response} = state do
    assert response.status == String.to_integer(code)
    {:ok, state}
  end

  defthen ~r/^the response body should contain a validation error for "(?<field>[^"]+)"$/,
          %{field: field},
          %{response: response} = state do
    assert Map.has_key?(response.body, "errors")
    errors = response.body["errors"]
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
          %{response: response} = state do
    assert Map.has_key?(response.body, field)
    assert response.body[field] != nil
    {:ok, state}
  end
end
