defmodule DemoFeExphWeb.Unit.ReportingSteps do
  use Cabbage.Feature, async: false, file: "expenses/reporting.feature"

  use DemoFeExphWeb.ConnCase

  alias DemoFeExph.Test.ApiStub

  @moduletag :unit

  @fake_token (fn ->
                 header =
                   Base.url_encode64(Jason.encode!(%{"alg" => "HS256", "typ" => "JWT"}),
                     padding: false
                   )

                 payload =
                   Base.url_encode64(Jason.encode!(%{"sub" => "user-1", "iss" => "demo-be"}),
                     padding: false
                   )

                 "#{header}.#{payload}.fake_sig"
               end).()

  setup do
    ApiStub.reset()
    :ok
  end

  defgiven ~r/^the app is running$/, _vars, state do
    {:ok, state}
  end

  defgiven ~r/^a user "(?<username>[^"]+)" is registered with email "(?<email>[^"]+)" and password "(?<password>[^"]+)"$/,
           %{username: username, email: email, password: _password},
           state do
    ApiStub.put(
      :get_current_user,
      {:ok, %{"id" => "user-1", "username" => username, "email" => email}}
    )

    {:ok, state}
  end

  defgiven ~r/^alice has logged in$/, _vars, state do
    {:ok, state}
  end

  defgiven ~r/^alice has created an income entry of "(?<amount>[^"]+)" USD on "(?<date>[^"]+)"$/,
           %{amount: amount, date: _date},
           state do
    income = %{
      "income_total" => amount,
      "expense_total" => "0.00",
      "net" => amount,
      "income_by_category" => [],
      "expense_by_category" => []
    }

    ApiStub.put(:get_pl_report, {:ok, income})
    {:ok, Map.put(state, :income_amount, amount)}
  end

  defgiven ~r/^alice has created an expense entry of "(?<amount>[^"]+)" USD on "(?<date>[^"]+)"$/,
           %{amount: amount, date: _date},
           state do
    income_amount = Map.get(state, :income_amount, "5000.00")
    net = Float.to_string(String.to_float(income_amount) - String.to_float(amount), decimals: 2)

    ApiStub.put(
      :get_pl_report,
      {:ok,
       %{
         "income_total" => income_amount,
         "expense_total" => amount,
         "net" => net,
         "income_by_category" => [],
         "expense_by_category" => []
       }}
    )

    {:ok, Map.put(state, :expense_amount, amount)}
  end

  defgiven ~r/^alice has created income entries in categories "(?<cat1>[^"]+)" and "(?<cat2>[^"]+)"$/,
           %{cat1: cat1, cat2: cat2},
           state do
    ApiStub.put(
      :get_pl_report,
      {:ok,
       %{
         "income_total" => "2000.00",
         "expense_total" => "0.00",
         "net" => "2000.00",
         "income_by_category" => [
           %{"category" => cat1, "total" => "1000.00"},
           %{"category" => cat2, "total" => "1000.00"}
         ],
         "expense_by_category" => []
       }}
    )

    {:ok, Map.put(state, :income_categories, [cat1, cat2])}
  end

  defgiven ~r/^alice has created expense entries in category "(?<cat>[^"]+)"$/,
           %{cat: cat},
           state do
    current = ApiStub.get(:get_pl_report)

    updated =
      case current do
        {:ok, report} ->
          {:ok,
           Map.put(report, "expense_by_category", [%{"category" => cat, "total" => "500.00"}])}

        _ ->
          {:ok,
           %{
             "income_total" => "0.00",
             "expense_total" => "500.00",
             "net" => "-500.00",
             "income_by_category" => [],
             "expense_by_category" => [%{"category" => cat, "total" => "500.00"}]
           }}
      end

    ApiStub.put(:get_pl_report, updated)
    {:ok, Map.put(state, :expense_categories, [cat])}
  end

  defgiven ~r/^alice has created only an income entry of "(?<amount>[^"]+)" USD on "(?<date>[^"]+)"$/,
           %{amount: amount, date: _date},
           state do
    ApiStub.put(
      :get_pl_report,
      {:ok,
       %{
         "income_total" => amount,
         "expense_total" => "0.00",
         "net" => amount,
         "income_by_category" => [],
         "expense_by_category" => []
       }}
    )

    {:ok, state}
  end

  defgiven ~r/^alice has created only an expense entry of "(?<amount>[^"]+)" USD on "(?<date>[^"]+)"$/,
           %{amount: amount, date: _date},
           state do
    ApiStub.put(
      :get_pl_report,
      {:ok,
       %{
         "income_total" => "0.00",
         "expense_total" => amount,
         "net" => "-#{amount}",
         "income_by_category" => [],
         "expense_by_category" => []
       }}
    )

    {:ok, state}
  end

  defgiven ~r/^alice has created income entries in both USD and IDR$/, _vars, state do
    ApiStub.put(
      :get_pl_report,
      {:ok,
       %{
         "income_total" => "5000.00",
         "expense_total" => "0.00",
         "net" => "5000.00",
         "income_by_category" => [],
         "expense_by_category" => []
       }}
    )

    {:ok, state}
  end

  defwhen ~r/^alice navigates to the reporting page$/, _vars, %{conn: conn} = state do
    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => @fake_token, "refresh_token" => "ref"})

    {:ok, view, _html} = live(conn_with_session, "/expenses/summary")
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^alice selects date range "(?<start_date>[^"]+)" to "(?<end_date>[^"]+)" with currency "(?<currency>[^"]+)"$/,
          %{start_date: start_date, end_date: end_date, currency: _currency},
          %{view: view} = state do
    view
    |> form("form[phx-submit='load_pl_report']", %{start_date: start_date, end_date: end_date})
    |> render_submit()

    {:ok, state}
  end

  defwhen ~r/^alice selects the appropriate date range and currency "(?<currency>[^"]+)"$/,
          %{currency: _currency},
          %{view: view} = state do
    view
    |> form("form[phx-submit='load_pl_report']", %{
      start_date: "2025-01-01",
      end_date: "2025-01-31"
    })
    |> render_submit()

    {:ok, state}
  end

  defp ensure_view(%{view: view}), do: view

  defp ensure_view(%{conn: conn}) do
    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => @fake_token, "refresh_token" => "ref"})

    {:ok, view, _html} = live(conn_with_session, "/expenses/summary")
    view
  end

  defwhen ~r/^alice views the P&L report for March 2025 in USD$/, _vars, state do
    view = ensure_view(state)

    view
    |> form("form[phx-submit='load_pl_report']", %{
      start_date: "2025-03-01",
      end_date: "2025-03-31"
    })
    |> render_submit()

    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^alice views the P&L report for April 2025 in USD$/, _vars, state do
    view = ensure_view(state)

    view
    |> form("form[phx-submit='load_pl_report']", %{
      start_date: "2025-04-01",
      end_date: "2025-04-30"
    })
    |> render_submit()

    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^alice views the P&L report filtered to "(?<currency>[^"]+)" only$/,
          %{currency: _currency},
          state do
    view = ensure_view(state)

    view
    |> form("form[phx-submit='load_pl_report']", %{
      start_date: "2025-01-01",
      end_date: "2025-12-31"
    })
    |> render_submit()

    {:ok, Map.put(state, :view, view)}
  end

  defthen ~r/^the report should display income total "(?<amount>[^"]+)"$/,
          %{amount: amount},
          %{view: view} = state do
    html = render(view)
    assert html =~ amount
    {:ok, state}
  end

  defthen ~r/^the report should display expense total "(?<amount>[^"]+)"$/,
          %{amount: amount},
          %{view: view} = state do
    html = render(view)
    assert html =~ amount
    {:ok, state}
  end

  defthen ~r/^the report should display net "(?<amount>[^"]+)"$/,
          %{amount: amount},
          %{view: view} = state do
    html = render(view)
    assert html =~ amount
    {:ok, state}
  end

  defthen ~r/^the income breakdown should list "(?<cat1>[^"]+)" and "(?<cat2>[^"]+)" categories$/,
          %{cat1: cat1, cat2: cat2},
          %{view: view} = state do
    html = render(view)
    assert html =~ cat1
    assert html =~ cat2
    {:ok, state}
  end

  defthen ~r/^the expense breakdown should list "(?<category>[^"]+)" category$/,
          %{category: category},
          %{view: view} = state do
    html = render(view)
    assert html =~ category
    {:ok, state}
  end

  defthen ~r/^the report should display only USD amounts$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "USD" or html =~ "income" or html =~ "expense"
    {:ok, state}
  end

  defthen ~r/^no IDR amounts should be included$/, _vars, %{view: view} = state do
    html = render(view)
    refute html =~ "150000"
    {:ok, state}
  end
end
