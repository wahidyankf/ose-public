defmodule DemoBeExphWeb.Unit.ReportingSteps do
  use Cabbage.Feature, async: false, file: "expenses/reporting.feature"

  use DemoBeExphWeb.ConnCase

  alias DemoBeExph.Integration.Helpers

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

  defgiven ~r/^alice has created an entry with body \{ (?<body>.+) \}$/,
           %{body: body_content},
           %{access_token: access_token} = state do
    body = Jason.encode!(Jason.decode!("{" <> body_content <> "}"))

    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> put_req_header("content-type", "application/json")
      |> post("/api/v1/expenses", body)

    assert conn.status == 201
    {:ok, state}
  end

  defwhen ~r/^alice sends GET \/api\/v1\/reports\/pl\?from=(?<from>[^&]+)&to=(?<to>[^&]+)&currency=(?<currency>[^\s]+)$/,
          %{from: from, to: to, currency: currency},
          %{access_token: access_token} = state do
    conn =
      build_conn()
      |> put_req_header("authorization", Helpers.bearer_header(access_token))
      |> get("/api/v1/reports/pl?from=#{from}&to=#{to}&currency=#{currency}")

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
    stored = body[field] |> Decimal.new() |> Decimal.to_string()
    expected = value |> Decimal.new() |> Decimal.to_string()
    assert stored == expected
    {:ok, state}
  end

  defthen ~r/^the income breakdown should contain "(?<category>[^"]+)" with amount "(?<amount>[^"]+)"$/,
          %{category: category, amount: amount},
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    income_breakdown = body["income_breakdown"]
    assert Map.has_key?(income_breakdown, category)
    stored = income_breakdown[category] |> Decimal.new() |> Decimal.to_string()
    expected = amount |> Decimal.new() |> Decimal.to_string()
    assert stored == expected
    {:ok, state}
  end

  defthen ~r/^the expense breakdown should contain "(?<category>[^"]+)" with amount "(?<amount>[^"]+)"$/,
          %{category: category, amount: amount},
          %{conn: conn} = state do
    body = Jason.decode!(conn.resp_body)
    expense_breakdown = body["expense_breakdown"]
    assert Map.has_key?(expense_breakdown, category)
    stored = expense_breakdown[category] |> Decimal.new() |> Decimal.to_string()
    expected = amount |> Decimal.new() |> Decimal.to_string()
    assert stored == expected
    {:ok, state}
  end
end
