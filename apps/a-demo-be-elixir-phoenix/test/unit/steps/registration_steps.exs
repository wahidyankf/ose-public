defmodule AADemoBeExphWeb.Unit.RegistrationSteps do
  use Cabbage.Feature, async: false, file: "user-lifecycle/registration.feature"

  use AADemoBeExphWeb.ConnCase

  alias ADemoBeExph.Integration.Helpers

  @moduletag :unit

  defgiven ~r/^the API is running$/, _vars, state do
    {:ok, state}
  end

  defgiven ~r/^a user "(?<username>[^"]+)" is registered with email "(?<email>[^"]+)" and password "(?<password>[^"]+)"$/,
           %{username: username, email: email, password: password},
           state do
    Helpers.register_user!(username, email, password)
    {:ok, state}
  end

  defwhen ~r/^the client sends POST \/api\/v1\/auth\/register with body \{ "username": "(?<username>[^"]+)", "email": "(?<email>[^"]+)", "password": "(?<password>[^"]*)" \}$/,
          %{username: username, email: email, password: password},
          state do
    body = Jason.encode!(%{username: username, email: email, password: password})

    conn =
      build_conn()
      |> put_req_header("content-type", "application/json")
      |> post("/api/v1/auth/register", body)

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

  defthen ~r/^the response body should not contain a "(?<field>[^"]+)" field$/,
          %{field: field},
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    refute Map.has_key?(body, field)
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

  defthen ~r/^the response body should contain an error message about duplicate username$/,
          _vars,
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert body["message"] =~ ~r/[Uu]sername.*exist|already|[Dd]uplicate/i
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
end
