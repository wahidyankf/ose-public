defmodule DemoFeExphWeb.Unit.UnitHandlingSteps do
  use Cabbage.Feature, async: false, file: "expenses/unit-handling.feature"

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

  @supported_units ~w(liter litre ml milliliter gallon pint quart cup
                      kg kilogram gram mg milligram pound lb ounce oz
                      meter metre cm centimeter mm millimeter km kilometer
                      inch foot feet yard mile
                      piece item unit each)

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

  defgiven ~r/^alice has created an expense with amount "(?<amount>[^"]+)", currency "(?<currency>[^"]+)", category "(?<category>[^"]+)", description "(?<description>[^"]+)", date "(?<date>[^"]+)", quantity (?<quantity>[^,]+), and unit "(?<unit>[^"]+)"$/,
           %{
             amount: amount,
             currency: currency,
             category: category,
             description: description,
             date: date,
             quantity: quantity,
             unit: unit
           },
           state do
    expense = %{
      "id" => "exp-1",
      "amount" => amount,
      "currency" => currency,
      "category" => category,
      "description" => description,
      "date" => date,
      "type" => "expense",
      "quantity" => quantity,
      "unit" => unit
    }

    ApiStub.put(:list_expenses, {:ok, %{"expenses" => [expense], "total" => 1}})
    ApiStub.put(:get_expense, {:ok, expense})
    ApiStub.put(:list_attachments, {:ok, %{"attachments" => []}})
    {:ok, Map.put(state, :current_expense, expense)}
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

  defwhen ~r/^alice fills in amount "(?<amount>[^"]+)", currency "(?<currency>[^"]+)", category "(?<category>[^"]+)", description "(?<description>[^"]+)", date "(?<date>[^"]+)", type "(?<type>[^"]+)", quantity (?<quantity>[^,]+), and unit "(?<unit>[^"]+)"$/,
          %{
            amount: amount,
            currency: currency,
            category: category,
            description: description,
            date: date,
            type: type,
            quantity: quantity,
            unit: unit
          },
          state do
    stub =
      if unit in @supported_units do
        {:ok, %{"id" => "exp-new"}}
      else
        {:error,
         {422,
          %{
            "message" => "Unit '#{unit}' is not supported.",
            "errors" => %{"unit" => ["is not supported"]}
          }}}
      end

    ApiStub.put(:create_expense, stub)

    form_data = %{
      amount: amount,
      currency: currency,
      category: category,
      description: description,
      date: date,
      type: type,
      quantity: quantity,
      unit: unit
    }

    {:ok, Map.put(state, :form_data, form_data)}
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
    created = %{
      "id" => "exp-new",
      "amount" => amount,
      "currency" => currency,
      "description" => description,
      "category" => category,
      "date" => date,
      "type" => type
    }

    ApiStub.put(:create_expense, {:ok, created})
    ApiStub.put(:list_expenses, {:ok, %{"expenses" => [created], "total" => 1}})

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

  defwhen ~r/^alice leaves the quantity and unit fields empty$/, _vars, state do
    {:ok, state}
  end

  defwhen ~r/^alice submits the entry form$/,
          _vars,
          %{view: view, form_data: form_data} = state do
    view |> form("form[phx-submit='create_expense']", form_data) |> render_submit()
    {:ok, state}
  end

  defthen ~r/^the quantity should display as "(?<quantity>[^"]+)"$/,
          %{quantity: quantity},
          %{view: view} = state do
    html = render(view)
    assert html =~ quantity
    {:ok, state}
  end

  defthen ~r/^the unit should display as "(?<unit>[^"]+)"$/,
          %{unit: unit},
          %{view: view} = state do
    html = render(view)
    assert html =~ unit
    {:ok, state}
  end

  defthen ~r/^a validation error for the unit field should be displayed$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "unit" or html =~ "Unit" or html =~ "not supported"
    {:ok, state}
  end

  defthen ~r/^the entry list should contain an entry with description "(?<description>[^"]+)"$/,
          %{description: description},
          %{view: view} = state do
    html = render(view)
    assert html =~ description
    {:ok, state}
  end
end
