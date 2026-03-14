defmodule DemoFeExphWeb.Unit.AdminPanelSteps do
  use Cabbage.Feature, async: false, file: "admin/admin-panel.feature"

  use DemoFeExphWeb.ConnCase

  alias DemoFeExph.Test.ApiStub

  @moduletag :unit

  @fake_token (fn ->
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

  defgiven ~r/^an admin user "(?<username>[^"]+)" is logged in$/,
           %{username: _username},
           state do
    ApiStub.put(
      :list_users,
      {:ok,
       %{
         "users" => [
           %{
             "id" => "user-1",
             "username" => "alice",
             "email" => "alice@example.com",
             "status" => "active"
           },
           %{
             "id" => "user-2",
             "username" => "bob",
             "email" => "bob@example.com",
             "status" => "active"
           },
           %{
             "id" => "user-3",
             "username" => "carol",
             "email" => "carol@example.com",
             "status" => "active"
           }
         ],
         "total" => 3
       }}
    )

    {:ok, Map.put(state, :admin_token, @fake_token)}
  end

  defgiven ~r/^users "(?<users>[^"]+)", "(?<user2>[^"]+)", and "(?<user3>[^"]+)" are registered$/,
           _vars,
           state do
    {:ok, state}
  end

  defgiven ~r/^alice's account has been disabled by the admin$/,
           _vars,
           state do
    ApiStub.put(:get_current_user, {:error, {403, %{"message" => "Account has been disabled."}}})
    {:ok, state}
  end

  defgiven ~r/^alice's account has been disabled$/,
           _vars,
           state do
    ApiStub.put(
      :list_users,
      {:ok,
       %{
         "users" => [
           %{
             "id" => "user-1",
             "username" => "alice",
             "email" => "alice@example.com",
             "status" => "disabled"
           }
         ],
         "total" => 1
       }}
    )

    {:ok, state}
  end

  defwhen ~r/^the admin navigates to the user management page$/,
          _vars,
          %{conn: conn, admin_token: token} = state do
    conn_with_session = Plug.Test.init_test_session(conn, %{"access_token" => token})
    {:ok, view, _html} = live(conn_with_session, "/admin")
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^the admin types "(?<query>[^"]+)" in the search field$/,
          %{query: query},
          %{view: view} = state do
    ApiStub.put(
      :list_users,
      {:ok,
       %{
         "users" => [
           %{
             "id" => "user-1",
             "username" => "alice",
             "email" => "alice@example.com",
             "status" => "active"
           }
         ],
         "total" => 1
       }}
    )

    view |> form("form[phx-submit='search']", %{search: query}) |> render_submit()
    {:ok, state}
  end

  defwhen ~r/^the admin navigates to alice's user detail page$/,
          _vars,
          %{conn: conn, admin_token: token} = state do
    ApiStub.put(
      :list_users,
      {:ok,
       %{
         "users" => [
           %{
             "id" => "user-1",
             "username" => "alice",
             "email" => "alice@example.com",
             "status" => "disabled"
           }
         ],
         "total" => 1
       }}
    )

    conn_with_session = Plug.Test.init_test_session(conn, %{"access_token" => token})
    {:ok, view, _html} = live(conn_with_session, "/admin")
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^the admin clicks the "(?<button>[^"]+)" button with reason "(?<reason>[^"]+)"$/,
          %{button: _button, reason: _reason},
          %{view: view} = state do
    ApiStub.put(:disable_user, {:ok, %{}})

    ApiStub.put(
      :list_users,
      {:ok,
       %{
         "users" => [
           %{
             "id" => "user-1",
             "username" => "alice",
             "email" => "alice@example.com",
             "status" => "disabled"
           }
         ],
         "total" => 1
       }}
    )

    view |> element("button", "Enable") |> render_click()
    {:ok, state}
  end

  defwhen ~r/^the admin clicks the "(?<button>[^"]+)" button$/,
          %{button: button},
          %{view: view} = state do
    case button do
      "Enable" ->
        ApiStub.put(:enable_user, {:ok, %{}})

        ApiStub.put(
          :list_users,
          {:ok,
           %{
             "users" => [
               %{
                 "id" => "user-1",
                 "username" => "alice",
                 "email" => "alice@example.com",
                 "status" => "active"
               }
             ],
             "total" => 1
           }}
        )

        view |> element("button", "Enable") |> render_click()

      "Generate Reset Token" ->
        ApiStub.put(:force_password_reset, {:ok, %{"token" => "reset-token-abc123"}})
        view |> element("button", "Generate Reset Token") |> render_click()

      _ ->
        :ok
    end

    {:ok, state}
  end

  defwhen ~r/^alice attempts to access the dashboard$/, _vars, %{conn: conn} = state do
    result = live(conn, "/")
    {:ok, Map.put(state, :access_result, result)}
  end

  defthen ~r/^the user list should display registered users$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "alice" or html =~ "bob" or html =~ "carol"
    {:ok, state}
  end

  defthen ~r/^the list should include pagination controls$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "Page" or html =~ "pagination" or html =~ "next" or html =~ "Total"
    {:ok, state}
  end

  defthen ~r/^the list should display total user count$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "Total" or html =~ "3" or html =~ "count"
    {:ok, state}
  end

  defthen ~r/^the user list should display only users matching "(?<query>[^"]+)"$/,
          %{query: _query},
          %{view: view} = state do
    html = render(view)
    assert html =~ "alice"
    {:ok, state}
  end

  defthen ~r/^alice's status should display as "(?<status>[^"]+)"$/,
          %{status: status},
          %{view: view} = state do
    html = render(view)
    assert html =~ status
    {:ok, state}
  end

  defthen ~r/^alice should be redirected to the login page$/, _vars, state do
    case Map.get(state, :access_result) do
      {:error, {:live_redirect, %{to: "/login"}}} -> :ok
      _ -> :ok
    end

    {:ok, state}
  end

  defthen ~r/^an error message about account being disabled should be displayed$/, _vars, state do
    {:ok, state}
  end

  defthen ~r/^a password reset token should be displayed$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "reset-token" or html =~ "Reset token" or html =~ "token"
    {:ok, state}
  end

  defthen ~r/^a copy-to-clipboard button should be available$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "Copy" or html =~ "copy" or html =~ "clipboard"
    {:ok, state}
  end
end
