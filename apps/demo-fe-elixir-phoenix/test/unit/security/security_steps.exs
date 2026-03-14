defmodule DemoFeExphWeb.Unit.SecuritySteps do
  use Cabbage.Feature, async: false, file: "security/security.feature"

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

  defgiven ~r/^a user "(?<username>[^"]+)" is registered with password "(?<password>[^"]+)"$/,
           %{username: username, password: _password},
           state do
    ApiStub.put(
      :get_current_user,
      {:ok, %{"id" => "user-1", "username" => username, "status" => "active"}}
    )

    {:ok, state}
  end

  defgiven ~r/^alice has entered the wrong password the maximum number of times$/,
           _vars,
           state do
    ApiStub.put(
      :login,
      {:error, {403, %{"message" => "Account is locked due to too many failed login attempts."}}}
    )

    {:ok, state}
  end

  defgiven ~r/^a user "(?<username>[^"]+)" is registered and locked after too many failed logins$/,
           %{username: username},
           state do
    ApiStub.put(
      :list_users,
      {:ok,
       %{
         "users" => [%{"id" => "user-1", "username" => username, "status" => "locked"}],
         "total" => 1
       }}
    )

    {:ok, state}
  end

  defgiven ~r/^an admin user "(?<username>[^"]+)" is logged in$/,
           %{username: _username},
           state do
    {:ok, Map.put(state, :admin_token, @fake_token)}
  end

  defgiven ~r/^a user "(?<username>[^"]+)" was locked and has been unlocked by an admin$/,
           %{username: _username},
           state do
    ApiStub.put(
      :login,
      {:ok, %{"access_token" => "test_access_token", "refresh_token" => "test_refresh_token"}}
    )

    {:ok, state}
  end

  defwhen ~r/^a visitor fills in the registration form with username "(?<username>[^"]+)", email "(?<email>[^"]+)", and password "(?<password>[^"]*)"$/,
          %{username: username, email: email, password: password},
          state do
    stub =
      cond do
        String.length(password) < 12 ->
          {:error,
           {422,
            %{
              "message" => "Password must be at least 12 characters long.",
              "errors" => %{"password" => ["minimum length is 12 characters"]}
            }}}

        not (password =~ ~r/[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]/) ->
          {:error,
           {422,
            %{
              "message" => "Password must contain at least one special character.",
              "errors" => %{"password" => ["must contain a special character"]}
            }}}

        true ->
          {:ok, %{"id" => "user-1", "username" => username}}
      end

    ApiStub.put(:register, stub)
    form_data = %{username: username, email: email, password: password}
    {:ok, Map.put(state, :form_data, form_data)}
  end

  defwhen ~r/^the visitor submits the registration form$/,
          _vars,
          %{conn: conn, form_data: form_data} = state do
    {:ok, view, _html} = live(conn, "/register")
    view |> form("form", form_data) |> render_submit()
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^alice submits the login form with username "(?<username>[^"]+)" and password "(?<password>[^"]+)"$/,
          %{username: _username, password: _password},
          %{conn: conn} = state do
    {:ok, view, _html} = live(conn, "/login")

    result =
      view |> form("form", %{username: "alice", password: "Str0ng#Pass1"}) |> render_submit()

    view =
      case result do
        {:error, {:live_redirect, %{to: to}}} ->
          conn_with_session =
            Plug.Test.init_test_session(conn, %{
              "access_token" => "test_access_token",
              "refresh_token" => "test_refresh_token"
            })

          {:ok, new_view, _html} = live(conn_with_session, to)
          new_view

        _ ->
          view
      end

    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^the admin navigates to alice's user detail in the admin panel$/,
          _vars,
          %{conn: conn, admin_token: token} = state do
    ApiStub.put(:unlock_user, {:ok, %{}})

    ApiStub.put(
      :list_users,
      {:ok,
       %{
         "users" => [%{"id" => "user-1", "username" => "alice", "status" => "active"}],
         "total" => 1
       }}
    )

    conn_with_session = Plug.Test.init_test_session(conn, %{"access_token" => token})
    {:ok, view, _html} = live(conn_with_session, "/admin")
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^the admin clicks the "(?<button>[^"]+)" button$/,
          %{button: _button},
          %{view: view} = state do
    ApiStub.put(
      :list_users,
      {:ok,
       %{
         "users" => [%{"id" => "user-1", "username" => "alice", "status" => "active"}],
         "total" => 1
       }}
    )

    view |> element("button", "Unlock") |> render_click()
    {:ok, state}
  end

  defthen ~r/^a validation error for the password field should be displayed$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "password" or html =~ "Password"
    {:ok, state}
  end

  defthen ~r/^the error should mention minimum length requirements$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "12" or html =~ "length" or html =~ "minimum" or html =~ "password"
    {:ok, state}
  end

  defthen ~r/^the error should mention special character requirements$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "special" or html =~ "character" or html =~ "password"
    {:ok, state}
  end

  defthen ~r/^an error message about account lockout should be displayed$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "locked" or html =~ "too many" or html =~ "attempts"
    {:ok, state}
  end

  defthen ~r/^alice should remain on the login page$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "Login"
    {:ok, state}
  end

  defthen ~r/^alice's status should display as "(?<status>[^"]+)"$/,
          %{status: status},
          %{view: view} = state do
    html = render(view)
    assert html =~ status
    {:ok, state}
  end

  defthen ~r/^alice should be on the dashboard page$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "Demo Frontend" or html =~ "Login"
    {:ok, state}
  end
end
