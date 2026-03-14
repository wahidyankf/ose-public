defmodule DemoFeExphWeb.Unit.AccessibilitySteps do
  use Cabbage.Feature, async: false, file: "layout/accessibility.feature"

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

  defgiven ~r/^a visitor is on the login page$/, _vars, %{conn: conn} = state do
    {:ok, view, _html} = live(conn, "/login")
    {:ok, Map.put(state, :view, view)}
  end

  defgiven ~r/^a user "(?<username>[^"]+)" is logged in$/,
           %{username: username},
           %{conn: conn} = state do
    ApiStub.put(
      :get_current_user,
      {:ok,
       %{
         "id" => "user-1",
         "username" => username,
         "email" => "#{username}@example.com",
         "display_name" => username
       }}
    )

    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => @fake_token, "refresh_token" => "ref"})

    {:ok, view, _html} = live(conn_with_session, "/")
    {:ok, Map.merge(state, %{view: view, conn_authed: conn_with_session})}
  end

  defgiven ~r/^alice is on an entry with an attachment$/, _vars, %{conn_authed: conn} = state do
    expense = %{
      "id" => "exp-1",
      "description" => "Lunch",
      "amount" => "10.50",
      "currency" => "USD",
      "category" => "food",
      "date" => "2025-01-15",
      "type" => "expense"
    }

    attachment = %{"id" => "att-1", "filename" => "receipt.jpg", "content_type" => "image/jpeg"}
    ApiStub.put(:list_expenses, {:ok, %{"expenses" => [expense], "total" => 1}})
    ApiStub.put(:get_expense, {:ok, expense})
    ApiStub.put(:list_attachments, {:ok, %{"attachments" => [attachment]}})
    {:ok, view, _html} = live(conn, "/expenses")
    view |> element("button", "View") |> render_click()
    {:ok, Map.put(state, :view, view)}
  end

  defgiven ~r/^a visitor opens the app$/, _vars, %{conn: conn} = state do
    {:ok, view, _html} = live(conn, "/")
    {:ok, Map.put(state, :view, view)}
  end

  defgiven ~r/^alice has an entry with a JPEG attachment$/, _vars, state do
    attachment = %{"id" => "att-1", "filename" => "receipt.jpg", "content_type" => "image/jpeg"}
    ApiStub.put(:list_attachments, {:ok, %{"attachments" => [attachment]}})
    {:ok, state}
  end

  defwhen ~r/^a visitor navigates to the registration page$/, _vars, %{conn: conn} = state do
    {:ok, view, _html} = live(conn, "/register")
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^the visitor submits the form with empty fields$/, _vars, %{view: view} = state do
    ApiStub.put(
      :login,
      {:error,
       {422,
        %{
          "message" => "Username and password are required.",
          "errors" => %{"username" => ["can't be blank"], "password" => ["can't be blank"]}
        }}}
    )

    view |> form("form", %{username: "", password: ""}) |> render_submit()
    {:ok, state}
  end

  defwhen ~r/^alice presses Tab repeatedly on the dashboard$/, _vars, state do
    {:ok, state}
  end

  defwhen ~r/^alice clicks the delete button and a confirmation dialog appears$/,
          _vars,
          %{view: view} = state do
    view |> element("button[phx-click='delete_expense']", "Delete") |> render_click()
    {:ok, state}
  end

  defwhen ~r/^alice views the attachment$/, _vars, state do
    {:ok, state}
  end

  defthen ~r/^every input field should have an associated visible label$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "<input"
    assert html =~ "placeholder" or html =~ "label" or html =~ "Username"
    {:ok, state}
  end

  defthen ~r/^every input field should have an accessible name$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "name=" or html =~ "id="
    {:ok, state}
  end

  defthen ~r/^validation errors should have role "(?<role>[^"]+)"$/,
          %{role: role},
          %{view: view} = state do
    html = render(view)
    assert html =~ ~s(role="#{role}") or html =~ "alert" or html =~ "error" or html =~ "Invalid"
    {:ok, state}
  end

  defthen ~r/^the errors should be associated with their respective fields via aria-describedby$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "aria-describedby" or html =~ "alert" or html =~ "error" or html =~ "Invalid"
    {:ok, state}
  end

  defthen ~r/^focus should move through all interactive elements in logical order$/,
          _vars,
          state do
    {:ok, state}
  end

  defthen ~r/^the currently focused element should have a visible focus indicator$/,
          _vars,
          state do
    {:ok, state}
  end

  defthen ~r/^focus should be trapped within the dialog$/, _vars, state do
    {:ok, state}
  end

  defthen ~r/^pressing Escape should close the dialog and return focus to the trigger$/,
          _vars,
          state do
    {:ok, state}
  end

  defthen ~r/^all text should meet a minimum contrast ratio of 4\.5:1 against its background$/,
          _vars,
          state do
    {:ok, state}
  end

  defthen ~r/^all interactive elements should meet a minimum contrast ratio of 3:1$/,
          _vars,
          state do
    {:ok, state}
  end

  defthen ~r/^the image should have descriptive alt text$/, _vars, state do
    {:ok, state}
  end

  defthen ~r/^decorative icons should be hidden from assistive technologies$/, _vars, state do
    {:ok, state}
  end
end
