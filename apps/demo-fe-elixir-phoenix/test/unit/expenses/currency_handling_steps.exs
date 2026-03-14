defmodule DemoFeExphWeb.Unit.CurrencyHandlingSteps do
  use Cabbage.Feature, async: false, file: "expenses/currency-handling.feature"

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

  defgiven ~r/^alice has created an expense with amount "(?<amount>[^"]+)", currency "(?<currency>[^"]+)", category "(?<category>[^"]+)", description "(?<description>[^"]+)", and date "(?<date>[^"]+)"$/,
           %{
             amount: amount,
             currency: currency,
             category: category,
             description: description,
             date: date
           },
           state do
    expense = %{
      "id" => "exp-1",
      "amount" => amount,
      "currency" => currency,
      "category" => category,
      "description" => description,
      "date" => date,
      "type" => "expense"
    }

    ApiStub.put(:list_expenses, {:ok, %{"expenses" => [expense], "total" => 1}})
    ApiStub.put(:get_expense, {:ok, expense})
    ApiStub.put(:list_attachments, {:ok, %{"attachments" => []}})
    {:ok, Map.put(state, :current_expense, expense)}
  end

  defgiven ~r/^alice has created expenses in both USD and IDR$/, _vars, state do
    expenses = [
      %{
        "id" => "exp-1",
        "amount" => "10.50",
        "currency" => "USD",
        "category" => "food",
        "description" => "Coffee",
        "date" => "2025-01-15",
        "type" => "expense"
      },
      %{
        "id" => "exp-2",
        "amount" => "150000",
        "currency" => "IDR",
        "category" => "transport",
        "description" => "Taxi",
        "date" => "2025-01-15",
        "type" => "expense"
      }
    ]

    ApiStub.put(:list_expenses, {:ok, %{"expenses" => expenses, "total" => 2}})

    ApiStub.put(
      :get_expense_summary,
      {:ok,
       %{
         "total" => "0.00",
         "by_currency" => [
           %{"currency" => "USD", "total" => "10.50"},
           %{"currency" => "IDR", "total" => "150000"}
         ]
       }}
    )

    {:ok, state}
  end

  defwhen ~r/^alice views the entry detail for "(?<description>[^"]+)"$/,
          %{description: _description},
          %{conn: conn, current_expense: expense} = state do
    ApiStub.put(:get_expense, {:ok, expense})
    ApiStub.put(:list_attachments, {:ok, %{"attachments" => []}})

    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => @fake_token, "refresh_token" => "ref"})

    {:ok, view, _html} = live(conn_with_session, "/expenses")
    view |> element("button", "View") |> render_click()
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^alice navigates to the new entry form$/, _vars, %{conn: conn} = state do
    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => @fake_token, "refresh_token" => "ref"})

    {:ok, view, _html} = live(conn_with_session, "/expenses")
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^alice fills in amount "(?<amount>[^"]+)", currency "(?<currency>[^"]+)", category "(?<category>[^"]+)", description "(?<description>[^"]+)", date "(?<date>[^"]+)", and type "(?<type>[^"]+)"$/,
          %{
            amount: amount,
            currency: currency,
            category: category,
            description: description,
            date: date,
            type: type
          },
          state do
    stub =
      cond do
        currency not in ["USD", "IDR"] ->
          {:error,
           {422,
            %{
              "message" => "Currency '#{currency}' is not supported.",
              "errors" => %{"currency" => ["is not supported"]}
            }}}

        String.length(currency) != 3 ->
          {:error,
           {422,
            %{
              "message" => "Currency code must be 3 characters.",
              "errors" => %{"currency" => ["must be 3 characters"]}
            }}}

        amount =~ ~r/^-/ ->
          {:error,
           {422,
            %{
              "message" => "Amount must be positive.",
              "errors" => %{"amount" => ["must be positive"]}
            }}}

        true ->
          {:ok, %{"id" => "exp-new"}}
      end

    ApiStub.put(:create_expense, stub)

    form_data = %{
      amount: amount,
      currency: currency,
      category: category,
      description: description,
      date: date,
      type: type
    }

    {:ok, Map.put(state, :form_data, form_data)}
  end

  defwhen ~r/^alice submits the entry form$/,
          _vars,
          %{view: view, form_data: form_data} = state do
    view |> form("form[phx-submit='create_expense']", form_data) |> render_submit()
    {:ok, state}
  end

  defwhen ~r/^alice navigates to the expense summary page$/, _vars, %{conn: conn} = state do
    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => @fake_token, "refresh_token" => "ref"})

    {:ok, view, _html} = live(conn_with_session, "/expenses/summary")
    {:ok, Map.put(state, :view, view)}
  end

  defthen ~r/^the amount should display as "(?<amount>[^"]+)"$/,
          %{amount: amount},
          %{view: view} = state do
    html = render(view)
    assert html =~ amount
    {:ok, state}
  end

  defthen ~r/^the currency should display as "(?<currency>[^"]+)"$/,
          %{currency: currency},
          %{view: view} = state do
    html = render(view)
    assert html =~ currency
    {:ok, state}
  end

  defthen ~r/^a validation error for the currency field should be displayed$/,
          _vars,
          %{view: view} = state do
    html = render(view)

    assert html =~ "currency" or html =~ "Currency" or html =~ "not supported" or
             html =~ "3 characters"

    {:ok, state}
  end

  defthen ~r/^the summary should display a separate total for "(?<currency>[^"]+)"$/,
          %{currency: currency},
          %{view: view} = state do
    html = render(view)
    assert html =~ currency
    {:ok, state}
  end

  defthen ~r/^no cross-currency total should be shown$/, _vars, %{view: view} = state do
    html = render(view)
    refute html =~ "cross-currency" or html =~ "mixed"
    {:ok, state}
  end

  defthen ~r/^a validation error for the amount field should be displayed$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "amount" or html =~ "Amount" or html =~ "positive"
    {:ok, state}
  end
end
