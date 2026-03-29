defmodule AADemoBeExphWeb.Integration.ReportingSteps do
  use Cabbage.Feature, async: false, file: "expenses/reporting.feature"

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

  defgiven ~r/^alice has created an entry with body \{ (?<body>.+) \}$/,
           %{body: body_content},
           %{access_token: access_token} = state do
    params = Jason.decode!("{" <> body_content <> "}")
    response = ServiceLayer.create_expense(access_token, params)
    assert response.status == 201
    {:ok, state}
  end

  defwhen ~r/^alice sends GET \/api\/v1\/reports\/pl\?from=(?<from>[^&]+)&to=(?<to>[^&]+)&currency=(?<currency>[^\s]+)$/,
          %{from: from, to: to, currency: currency},
          %{access_token: access_token} = state do
    response = ServiceLayer.pl_report(access_token, from, to, currency)
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
    stored = response.body[field] |> Decimal.new() |> Decimal.to_string()
    expected = value |> Decimal.new() |> Decimal.to_string()
    assert stored == expected
    {:ok, state}
  end

  defthen ~r/^the income breakdown should contain "(?<category>[^"]+)" with amount "(?<amount>[^"]+)"$/,
          %{category: category, amount: amount},
          %{response: response} = state do
    income_breakdown = response.body["incomeBreakdown"]
    entry = Enum.find(income_breakdown, fn item -> item["category"] == category end)

    assert entry != nil,
           "Category '#{category}' not found in incomeBreakdown: #{inspect(income_breakdown)}"

    stored = entry["total"] |> Decimal.new() |> Decimal.to_string()
    expected = amount |> Decimal.new() |> Decimal.to_string()
    assert stored == expected
    {:ok, state}
  end

  defthen ~r/^the expense breakdown should contain "(?<category>[^"]+)" with amount "(?<amount>[^"]+)"$/,
          %{category: category, amount: amount},
          %{response: response} = state do
    expense_breakdown = response.body["expenseBreakdown"]
    entry = Enum.find(expense_breakdown, fn item -> item["category"] == category end)

    assert entry != nil,
           "Category '#{category}' not found in expenseBreakdown: #{inspect(expense_breakdown)}"

    stored = entry["total"] |> Decimal.new() |> Decimal.to_string()
    expected = amount |> Decimal.new() |> Decimal.to_string()
    assert stored == expected
    {:ok, state}
  end
end
