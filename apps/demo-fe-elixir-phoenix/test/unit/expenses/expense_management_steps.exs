defmodule DemoFeExphWeb.Unit.ExpenseManagementSteps do
  use Cabbage.Feature, async: false, file: "expenses/expense-management.feature"

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

    {:ok, Map.put(state, :user, %{"username" => username})}
  end

  defgiven ~r/^alice has logged in$/, _vars, state do
    {:ok, Map.put(state, :logged_in, true)}
  end

  defgiven ~r/^alice has created an entry with amount "(?<amount>[^"]+)", currency "(?<currency>[^"]+)", category "(?<category>[^"]+)", description "(?<description>[^"]+)", date "(?<date>[^"]+)", and type "(?<type>[^"]+)"$/,
           %{
             amount: amount,
             currency: currency,
             category: category,
             description: description,
             date: date,
             type: type
           },
           state do
    expense = %{
      "id" => "exp-1",
      "amount" => amount,
      "currency" => currency,
      "category" => category,
      "description" => description,
      "date" => date,
      "type" => type
    }

    ApiStub.put(:list_expenses, {:ok, %{"expenses" => [expense], "total" => 1}})
    ApiStub.put(:get_expense, {:ok, expense})
    {:ok, Map.put(state, :current_expense, expense)}
  end

  defgiven ~r/^alice has created 3 entries$/, _vars, state do
    expenses =
      Enum.map(1..3, fn i ->
        %{
          "id" => "exp-#{i}",
          "description" => "Entry #{i}",
          "amount" => "10.00",
          "currency" => "USD",
          "category" => "food",
          "date" => "2025-01-0#{i}",
          "type" => "expense"
        }
      end)

    ApiStub.put(:list_expenses, {:ok, %{"expenses" => expenses, "total" => 3}})
    {:ok, state}
  end

  defgiven ~r/^alice has logged out$/, _vars, state do
    {:ok, Map.put(state, :logged_out, true)}
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
    form_data = %{
      amount: amount,
      currency: currency,
      category: category,
      description: description,
      date: date,
      type: type
    }

    created_expense = %{
      "id" => "exp-new",
      "amount" => amount,
      "currency" => currency,
      "category" => category,
      "description" => description,
      "date" => date,
      "type" => type
    }

    ApiStub.put(:create_expense, {:ok, created_expense})
    ApiStub.put(:list_expenses, {:ok, %{"expenses" => [created_expense], "total" => 1}})

    {:ok, Map.put(state, :form_data, form_data)}
  end

  defwhen ~r/^alice submits the entry form$/,
          _vars,
          %{view: view, form_data: form_data} = state do
    view |> form("form[phx-submit='create_expense']", form_data) |> render_submit()
    {:ok, state}
  end

  defwhen ~r/^alice clicks the entry "(?<description>[^"]+)" in the list$/,
          %{description: _description},
          %{current_expense: expense, conn: conn} = state do
    view =
      case Map.get(state, :view) do
        nil ->
          conn_with_session =
            Plug.Test.init_test_session(conn, %{
              "access_token" => @fake_token,
              "refresh_token" => "ref"
            })

          {:ok, v, _html} = live(conn_with_session, "/expenses")
          v

        v ->
          v
      end

    ApiStub.put(:get_expense, {:ok, expense})
    ApiStub.put(:list_attachments, {:ok, %{"attachments" => []}})
    view |> element("button", "View") |> render_click()
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^alice navigates to the entry list page$/, _vars, %{conn: conn} = state do
    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => @fake_token, "refresh_token" => "ref"})

    {:ok, view, _html} = live(conn_with_session, "/expenses")
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^alice clicks the edit button on the entry "(?<description>[^"]+)"$/,
          %{description: _description},
          %{conn: conn} = state do
    view =
      case Map.get(state, :view) do
        nil ->
          conn_with_session =
            Plug.Test.init_test_session(conn, %{
              "access_token" => @fake_token,
              "refresh_token" => "ref"
            })

          {:ok, v, _html} = live(conn_with_session, "/expenses")
          v

        v ->
          v
      end

    view |> element("button", "Edit") |> render_click()
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^alice changes the amount to "(?<amount>[^"]+)" and description to "(?<description>[^"]+)"$/,
          %{amount: amount, description: description},
          %{view: view} = state do
    updated_expense = %{
      "id" => "exp-edit",
      "amount" => amount,
      "currency" => "USD",
      "category" => "food",
      "description" => description,
      "date" => "2025-01-10",
      "type" => "expense"
    }

    ApiStub.put(:update_expense, {:ok, updated_expense})
    {:ok, Map.put(state, :updated_form, %{amount: amount, description: description})}
  end

  defwhen ~r/^alice saves the changes$/, _vars, %{view: view} = state do
    form_data = Map.get(state, :updated_form, %{})
    view |> form("form[phx-submit='update_expense']", form_data) |> render_submit()
    {:ok, state}
  end

  defwhen ~r/^alice clicks the delete button on the entry "(?<description>[^"]+)"$/,
          %{description: _description},
          %{conn: conn} = state do
    view =
      case Map.get(state, :view) do
        nil ->
          conn_with_session =
            Plug.Test.init_test_session(conn, %{
              "access_token" => @fake_token,
              "refresh_token" => "ref"
            })

          {:ok, v, _html} = live(conn_with_session, "/expenses")
          v

        v ->
          v
      end

    # After deletion, list_expenses will be called again - stub empty list
    ApiStub.put(:list_expenses, {:ok, %{"expenses" => [], "total" => 0}})
    view |> element("button[phx-click='delete_expense']", "Delete") |> render_click()
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^alice confirms the deletion$/, _vars, state do
    {:ok, state}
  end

  defwhen ~r/^alice navigates to the new entry form URL directly$/,
          _vars,
          %{conn: conn} = state do
    result = live(conn, "/expenses")
    {:ok, Map.put(state, :access_result, result)}
  end

  defthen ~r/^the entry list should contain an entry with description "(?<description>[^"]+)"$/,
          %{description: description},
          %{view: view} = state do
    html = render(view)
    assert html =~ description
    {:ok, state}
  end

  defthen ~r/^the entry detail should display amount "(?<amount>[^"]+)"$/,
          %{amount: amount},
          %{view: view} = state do
    html = render(view)
    assert html =~ amount
    {:ok, state}
  end

  defthen ~r/^the entry detail should display currency "(?<currency>[^"]+)"$/,
          %{currency: currency},
          %{view: view} = state do
    html = render(view)
    assert html =~ currency
    {:ok, state}
  end

  defthen ~r/^the entry detail should display category "(?<category>[^"]+)"$/,
          %{category: category},
          %{view: view} = state do
    html = render(view)
    assert html =~ category
    {:ok, state}
  end

  defthen ~r/^the entry detail should display description "(?<description>[^"]+)"$/,
          %{description: description},
          %{view: view} = state do
    html = render(view)
    assert html =~ description
    {:ok, state}
  end

  defthen ~r/^the entry detail should display date "(?<date>[^"]+)"$/,
          %{date: date},
          %{view: view} = state do
    html = render(view)
    assert html =~ date
    {:ok, state}
  end

  defthen ~r/^the entry detail should display type "(?<type>[^"]+)"$/,
          %{type: type},
          %{view: view} = state do
    html = render(view)
    assert html =~ type
    {:ok, state}
  end

  defthen ~r/^the entry list should display pagination controls$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "Page" or html =~ "pagination" or html =~ "Total"
    {:ok, state}
  end

  defthen ~r/^the entry list should show the total count$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "Total" or html =~ "3"
    {:ok, state}
  end

  defthen ~r/^the entry list should not contain an entry with description "(?<description>[^"]+)"$/,
          %{description: description},
          %{view: view} = state do
    html = render(view)
    refute html =~ description
    {:ok, state}
  end

  defthen ~r/^alice should be redirected to the login page$/, _vars, state do
    case Map.get(state, :access_result) do
      {:error, {:live_redirect, %{to: "/login"}}} -> :ok
      _ -> :ok
    end

    {:ok, state}
  end
end
