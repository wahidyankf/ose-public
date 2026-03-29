defmodule AADemoBeExphWeb.Integration.UnitHandlingSteps do
  use Cabbage.Feature, async: false, file: "expenses/unit-handling.feature"

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
    {:ok, Map.put(state, :alice, user)}
  end

  defgiven ~r/^"alice" has logged in and stored the access token$/,
           _vars,
           %{alice: user} = state do
    {access_token, _} = Helpers.login_user!(user)
    {:ok, Map.put(state, :access_token, access_token)}
  end

  defgiven ~r/^alice has created an expense with body \{ (?<body>.+) \}$/,
           %{body: body_content},
           %{access_token: access_token} = state do
    params = Jason.decode!("{" <> body_content <> "}")
    response = ServiceLayer.create_expense(access_token, params)
    assert response.status == 201
    {:ok, Map.put(state, :expense_id, response.body["id"])}
  end

  defwhen ~r/^alice sends GET \/api\/v1\/expenses\/\{expenseId\}$/,
          _vars,
          %{access_token: access_token, expense_id: expense_id} = state do
    response = ServiceLayer.get_expense(access_token, expense_id)
    {:ok, Map.put(state, :response, response)}
  end

  defwhen ~r/^alice sends POST \/api\/v1\/expenses with body \{ (?<body>.+) \}$/,
          %{body: body_content},
          %{access_token: access_token} = state do
    params = Jason.decode!("{" <> body_content <> "}")
    response = ServiceLayer.create_expense(access_token, params)
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
    assert to_string(response.body[field]) == value
    {:ok, state}
  end

  defthen ~r/^the response body should contain "(?<field>[^"]+)" equal to (?<value>[0-9.]+)$/,
          %{field: field, value: value},
          %{response: response} = state do
    actual = response.body[field]

    expected =
      if String.contains?(value, ".") do
        String.to_float(value)
      else
        String.to_integer(value)
      end

    assert actual == expected
    {:ok, state}
  end

  defthen ~r/^the response body should contain a validation error for "(?<field>[^"]+)"$/,
          %{field: field},
          %{response: response} = state do
    assert Map.has_key?(response.body, "errors")
    errors = response.body["errors"]
    assert Map.has_key?(errors, field)
    {:ok, state}
  end
end
