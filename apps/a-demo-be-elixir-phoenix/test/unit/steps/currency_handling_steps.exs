defmodule AADemoBeExphWeb.Unit.CurrencyHandlingSteps do
  use Cabbage.Feature, async: false, file: "expenses/currency-handling.feature"

  use AADemoBeExphWeb.ConnCase

  alias ADemoBeExph.Integration.Helpers

  @moduletag :unit

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
    body = Jason.encode!(Jason.decode!("{" <> body_content <> "}"))

    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> put_req_header("content-type", "application/json")
      |> post("/api/v1/expenses", body)

    assert conn.status == 201
    expense_body = Jason.decode!(conn.resp_body)
    {:ok, Map.put(state, :expense_id, expense_body["id"])}
  end

  defwhen ~r/^alice sends GET \/api\/v1\/expenses\/\{expenseId\}$/,
          _vars,
          %{access_token: access_token, expense_id: expense_id} = state do
    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> get("/api/v1/expenses/#{expense_id}")

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^alice sends POST \/api\/v1\/expenses with body \{ (?<body>.+) \}$/,
          %{body: body_content},
          %{access_token: access_token} = state do
    body = Jason.encode!(Jason.decode!("{" <> body_content <> "}"))

    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> put_req_header("content-type", "application/json")
      |> post("/api/v1/expenses", body)

    {:ok, Map.put(state, :conn, conn)}
  end

  defwhen ~r/^alice sends GET \/api\/v1\/expenses\/summary$/,
          _vars,
          %{access_token: access_token} = state do
    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> get("/api/v1/expenses/summary")

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
    assert to_string(body[field]) == value
    {:ok, state}
  end

  defthen ~r/^the response body should contain a validation error for "(?<field>[^"]+)"$/,
          %{field: field},
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert Map.has_key?(body, "errors")
    errors = body["errors"]
    assert Map.has_key?(errors, field)
    {:ok, state}
  end

  defthen ~r/^the response body should contain "(?<currency>[^"]+)" total equal to "(?<amount>[^"]+)"$/,
          %{currency: currency, amount: amount},
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    assert Map.has_key?(body, currency)
    stored = body[currency] |> Decimal.new() |> Decimal.to_string()
    expected = amount |> Decimal.new() |> Decimal.to_string()
    assert stored == expected
    {:ok, state}
  end
end
