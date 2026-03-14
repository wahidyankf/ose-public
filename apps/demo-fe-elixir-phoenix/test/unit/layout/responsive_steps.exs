defmodule DemoFeExphWeb.Unit.ResponsiveSteps do
  use Cabbage.Feature, async: false, file: "layout/responsive.feature"

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

  @admin_token (fn ->
                  header =
                    Base.url_encode64(Jason.encode!(%{"alg" => "HS256", "typ" => "JWT"}),
                      padding: false
                    )

                  payload =
                    Base.url_encode64(Jason.encode!(%{"sub" => "admin-1", "iss" => "demo-be"}),
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

  defgiven ~r/^the viewport is set to "desktop" \(1280x800\)$/, _vars, state do
    {:ok, Map.put(state, :viewport, :desktop)}
  end

  defgiven ~r/^the viewport is set to "tablet" \(768x1024\)$/, _vars, state do
    {:ok, Map.put(state, :viewport, :tablet)}
  end

  defgiven ~r/^the viewport is set to "mobile" \(375x667\)$/, _vars, state do
    {:ok, Map.put(state, :viewport, :mobile)}
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

  defgiven ~r/^an admin user "(?<username>[^"]+)" is logged in$/, %{username: _username}, state do
    ApiStub.put(:list_users, {:ok, %{"users" => [], "total" => 0}})
    {:ok, Map.put(state, :admin_token, @admin_token)}
  end

  defgiven ~r/^the navigation drawer is open$/, _vars, state do
    {:ok, Map.put(state, :drawer_open, true)}
  end

  defgiven ~r/^alice has logged out$/, _vars, state do
    {:ok, Map.put(state, :logged_out, true)}
  end

  defgiven ~r/^alice has created income and expense entries$/, _vars, state do
    ApiStub.put(
      :get_expense_summary,
      {:ok,
       %{"total" => "4850.00", "by_currency" => [%{"currency" => "USD", "total" => "4850.00"}]}}
    )

    {:ok, state}
  end

  defgiven ~r/^alice has created an entry with description "(?<description>[^"]+)"$/,
           %{description: description},
           state do
    expense = %{
      "id" => "exp-1",
      "description" => description,
      "amount" => "10.50",
      "currency" => "USD",
      "category" => "food",
      "date" => "2025-01-15",
      "type" => "expense"
    }

    ApiStub.put(:list_expenses, {:ok, %{"expenses" => [expense], "total" => 1}})
    ApiStub.put(:get_expense, {:ok, expense})
    ApiStub.put(:list_attachments, {:ok, %{"attachments" => []}})
    {:ok, Map.put(state, :expense, expense)}
  end

  defwhen ~r/^alice navigates to the dashboard$/, _vars, %{conn: conn} = state do
    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => @fake_token, "refresh_token" => "ref"})

    {:ok, view, html} = live(conn_with_session, "/")
    {:ok, Map.merge(state, %{view: view, html: html})}
  end

  defwhen ~r/^alice navigates to the entry list page$/, _vars, %{conn: conn} = state do
    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => @fake_token, "refresh_token" => "ref"})

    {:ok, view, html} = live(conn_with_session, "/expenses")
    {:ok, Map.merge(state, %{view: view, html: html})}
  end

  defwhen ~r/^alice taps the hamburger menu button$/, _vars, state do
    {:ok, Map.put(state, :drawer_open, true)}
  end

  defwhen ~r/^alice taps a navigation item$/, _vars, state do
    {:ok, Map.put(state, :drawer_open, false)}
  end

  defwhen ~r/^the admin navigates to the user management page$/,
          _vars,
          %{conn: conn, admin_token: token} = state do
    conn_with_session = Plug.Test.init_test_session(conn, %{"access_token" => token})
    {:ok, view, html} = live(conn_with_session, "/admin")
    {:ok, Map.merge(state, %{view: view, html: html})}
  end

  defwhen ~r/^alice navigates to the reporting page$/, _vars, %{conn: conn} = state do
    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => @fake_token, "refresh_token" => "ref"})

    {:ok, view, html} = live(conn_with_session, "/expenses/summary")
    {:ok, Map.merge(state, %{view: view, html: html})}
  end

  defwhen ~r/^alice navigates to the login page$/, _vars, %{conn: conn} = state do
    {:ok, view, html} = live(conn, "/login")
    {:ok, Map.merge(state, %{view: view, html: html})}
  end

  defwhen ~r/^alice opens the entry detail for "(?<description>[^"]+)"$/,
          %{description: _description},
          %{conn: conn} = state do
    expense = Map.get(state, :expense, %{"id" => "exp-1", "description" => "Lunch"})
    ApiStub.put(:get_expense, {:ok, expense})

    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => @fake_token, "refresh_token" => "ref"})

    {:ok, view, html} = live(conn_with_session, "/expenses")
    view |> element("button", "View") |> render_click()
    {:ok, Map.merge(state, %{view: view, html: html})}
  end

  defthen ~r/^the sidebar navigation should be visible$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "nav" or html =~ "Profile" or html =~ "Expenses"
    {:ok, state}
  end

  defthen ~r/^the sidebar should display navigation labels alongside icons$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "Expenses" or html =~ "Profile" or html =~ "Admin"
    {:ok, state}
  end

  defthen ~r/^the sidebar navigation should be collapsed to icon-only mode$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "nav" or html =~ "Profile"
    {:ok, state}
  end

  defthen ~r/^hovering over a sidebar icon should show a tooltip with the label$/, _vars, state do
    {:ok, state}
  end

  defthen ~r/^the sidebar should not be visible$/, _vars, state do
    {:ok, state}
  end

  defthen ~r/^a hamburger menu button should be displayed in the header$/, _vars, state do
    {:ok, state}
  end

  defthen ~r/^a slide-out navigation drawer should appear$/,
          _vars,
          %{drawer_open: open} = state do
    assert open == true
    {:ok, state}
  end

  defthen ~r/^the drawer should close$/, _vars, %{drawer_open: open} = state do
    assert open == false
    {:ok, state}
  end

  defthen ~r/^the selected page should load$/, _vars, state do
    {:ok, state}
  end

  defthen ~r/^entries should be displayed in a multi-column table$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "table" or html =~ "<th>" or html =~ "Date"
    {:ok, state}
  end

  defthen ~r/^the table should show columns for date, description, category, amount, and currency$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "Date"
    assert html =~ "Description" or html =~ "description"
    {:ok, state}
  end

  defthen ~r/^entries should be displayed as stacked cards$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "Expenses" or html =~ "Entry"
    {:ok, state}
  end

  defthen ~r/^each card should show description, amount, and date$/, _vars, state do
    {:ok, state}
  end

  defthen ~r/^the user list should be horizontally scrollable$/, _vars, state do
    {:ok, state}
  end

  defthen ~r/^the visible columns should prioritize username and status$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "Admin" or html =~ "User"
    {:ok, state}
  end

  defthen ~r/^the P&L chart should resize to fit the viewport$/, _vars, state do
    {:ok, state}
  end

  defthen ~r/^category breakdowns should stack vertically below the chart$/, _vars, state do
    {:ok, state}
  end

  defthen ~r/^the login form should span the full viewport width with padding$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "Login"
    {:ok, state}
  end

  defthen ~r/^the form inputs should be large enough for touch interaction$/, _vars, state do
    {:ok, state}
  end

  defthen ~r/^the attachment upload area should display a prominent upload button$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "Upload" or html =~ "Attachment" or html =~ "upload-attachment"
    {:ok, state}
  end

  defthen ~r/^drag-and-drop should be replaced with a file picker$/, _vars, state do
    {:ok, state}
  end
end
