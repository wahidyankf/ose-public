defmodule AADemoBeExphWeb.Unit.PasswordLoginSteps do
  use Cabbage.Feature, async: false, file: "authentication/password-login.feature"

  use AADemoBeExphWeb.ConnCase

  alias ADemoBeExph.Integration.Helpers

  @moduletag :unit

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

  defthen ~r/^the response body should contain a non-null "(?<field>[^"]+)" field$/,
          %{field: field},
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert Map.has_key?(body, field)
    assert body[field] != nil
    {:ok, state}
  end

  defthen ~r/^the response body should contain "(?<field>[^"]+)" equal to "(?<value>[^"]+)"$/,
          %{field: field, value: value},
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert body[field] == value
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
    assert body["message"] =~ ~r/[Dd]eactivat|[Ii]nactive|[Dd]isbaled/i
    {:ok, state}
  end
end
