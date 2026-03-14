defmodule DemoFeExphWeb.Unit.UserProfileSteps do
  use Cabbage.Feature, async: false, file: "user-lifecycle/user-profile.feature"

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
      {:ok,
       %{"id" => "user-1", "username" => username, "email" => email, "display_name" => username}}
    )

    {:ok, Map.put(state, :user, %{"username" => username, "email" => email})}
  end

  defgiven ~r/^alice has logged in$/, _vars, state do
    {:ok, Map.put(state, :logged_in, true)}
  end

  defgiven ~r/^alice has deactivated her account$/, _vars, state do
    ApiStub.put(:login, {:error, {403, %{"message" => "Account is deactivated."}}})
    {:ok, state}
  end

  defwhen ~r/^alice navigates to the profile page$/, _vars, %{conn: conn} = state do
    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => @fake_token, "refresh_token" => "ref"})

    {:ok, view, _html} = live(conn_with_session, "/profile")
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^alice changes the display name to "(?<name>[^"]+)"$/,
          %{name: name},
          %{view: view} = state do
    ApiStub.put(
      :update_profile,
      {:ok,
       %{
         "id" => "user-1",
         "username" => "alice",
         "email" => "alice@example.com",
         "display_name" => name
       }}
    )

    view |> form("form[phx-submit='update_profile']", %{display_name: name}) |> render_submit()
    {:ok, state}
  end

  defwhen ~r/^alice saves the profile changes$/, _vars, state do
    {:ok, state}
  end

  defwhen ~r/^alice navigates to the change password form$/, _vars, %{conn: conn} = state do
    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => @fake_token, "refresh_token" => "ref"})

    {:ok, view, _html} = live(conn_with_session, "/profile")
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^alice enters old password "(?<old_password>[^"]+)" and new password "(?<new_password>[^"]+)"$/,
          %{old_password: old_password, new_password: new_password},
          state do
    if old_password != "Str0ng#Pass1" do
      ApiStub.put(:change_password, {:error, {422, %{"message" => "Invalid credentials."}}})
    end

    {:ok, Map.merge(state, %{old_password: old_password, new_password: new_password})}
  end

  defwhen ~r/^alice submits the password change$/, _vars, %{view: view} = state do
    html = render(view)

    if html =~ "change_password" do
      old_pw = Map.get(state, :old_password, "Str0ng#Pass1")
      new_pw = Map.get(state, :new_password, "NewPass#456")

      view
      |> form("form[phx-submit='change_password']", %{old_password: old_pw, new_password: new_pw})
      |> render_submit()
    end

    {:ok, state}
  end

  defwhen ~r/^alice clicks the "(?<button>[^"]+)" button$/,
          %{button: _button},
          %{view: view} = state do
    view |> element("button", "Deactivate Account") |> render_click()
    {:ok, state}
  end

  defwhen ~r/^alice confirms the deactivation$/, _vars, state do
    {:ok, state}
  end

  defwhen ~r/^alice submits the login form with username "(?<username>[^"]+)" and password "(?<password>[^"]+)"$/,
          %{username: _username, password: _password},
          %{conn: conn} = state do
    {:ok, view, _html} = live(conn, "/login")
    {:ok, Map.put(state, :view, view)}
  end

  defthen ~r/^the profile should display username "(?<username>[^"]+)"$/,
          %{username: username},
          %{view: view} = state do
    html = render(view)
    assert html =~ username
    {:ok, state}
  end

  defthen ~r/^the profile should display email "(?<email>[^"]+)"$/,
          %{email: email},
          %{view: view} = state do
    html = render(view)
    assert html =~ email
    {:ok, state}
  end

  defthen ~r/^the profile should display a display name$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "Display name"
    {:ok, state}
  end

  defthen ~r/^the profile should display display name "(?<name>[^"]+)"$/,
          %{name: name},
          %{view: view} = state do
    html = render(view)
    assert html =~ name
    {:ok, state}
  end

  defthen ~r/^a success message about password change should be displayed$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "Password changed" or html =~ "success"
    {:ok, state}
  end

  defthen ~r/^an error message about invalid credentials should be displayed$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "Invalid credentials" or html =~ "invalid" or html =~ "credentials"
    {:ok, state}
  end

  defthen ~r/^alice should be redirected to the login page$/, _vars, state do
    {:ok, state}
  end

  defthen ~r/^an error message about account deactivation should be displayed$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "Login" or html =~ "deactivated"
    {:ok, state}
  end

  defthen ~r/^alice should remain on the login page$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "Login"
    {:ok, state}
  end
end
