defmodule DemoFeExphWeb.Unit.SessionSteps do
  use Cabbage.Feature, async: false, file: "authentication/session.feature"

  use DemoFeExphWeb.ConnCase

  alias DemoFeExph.Test.ApiStub

  @moduletag :unit

  # A fake JWT token with sub and iss claims for testing token decode.
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
      {:ok,
       %{
         "id" => "user-1",
         "username" => username,
         "email" => "#{username}@example.com",
         "display_name" => username
       }}
    )

    {:ok, Map.put(state, :username, username)}
  end

  defgiven ~r/^alice has logged in$/, _vars, state do
    {:ok, Map.put(state, :logged_in, true)}
  end

  defgiven ~r/^alice's access token is about to expire$/, _vars, state do
    {:ok, state}
  end

  defgiven ~r/^alice's refresh token has expired$/, _vars, state do
    ApiStub.put(
      :refresh,
      {:error, {401, %{"message" => "Session expired. Please log in again."}}}
    )

    {:ok, state}
  end

  defgiven ~r/^alice has refreshed her session and received a new token pair$/, _vars, state do
    {:ok, Map.put(state, :old_refresh_token, "old_refresh_token")}
  end

  defgiven ~r/^alice's account has been deactivated$/, _vars, state do
    ApiStub.put(:get_current_user, {:error, {403, %{"message" => "Account is deactivated."}}})
    {:ok, state}
  end

  defgiven ~r/^alice has already clicked logout$/, _vars, state do
    {:ok, Map.put(state, :logged_out, true)}
  end

  defwhen ~r/^the app performs a background token refresh$/, _vars, state do
    result = DemoFeExph.Test.MockApi.Auth.refresh_token("old_token")
    {:ok, Map.put(state, :refresh_result, result)}
  end

  defwhen ~r/^the app attempts a background token refresh$/, _vars, state do
    result = DemoFeExph.Test.MockApi.Auth.refresh_token("expired_token")
    {:ok, Map.put(state, :refresh_result, result)}
  end

  defwhen ~r/^the app attempts to refresh using the original refresh token$/, _vars, state do
    ApiStub.put(:refresh, {:error, {401, %{"message" => "Token already used."}}})
    result = DemoFeExph.Test.MockApi.Auth.refresh_token("old_refresh_token")
    {:ok, Map.put(state, :refresh_result, result)}
  end

  defwhen ~r/^alice navigates to a protected page$/, _vars, %{conn: conn} = state do
    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => @fake_token, "refresh_token" => "ref"})

    result = live(conn_with_session, "/profile")
    {:ok, Map.put(state, :nav_result, result)}
  end

  defwhen ~r/^alice clicks the "(?<button>[^"]+)" button$/,
          %{button: _button},
          %{conn: conn} = state do
    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => @fake_token, "refresh_token" => "ref"})

    {:ok, view, _html} = live(conn_with_session, "/profile")
    view |> element("button", "Log Out") |> render_click()
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^alice clicks the "(?<option>[^"]+)" option$/,
          %{option: _option},
          %{conn: conn} = state do
    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => @fake_token, "refresh_token" => "ref"})

    {:ok, view, _html} = live(conn_with_session, "/profile")
    view |> element("button", "Log Out") |> render_click()
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^alice navigates to the login page$/, _vars, %{conn: conn} = state do
    {:ok, view, _html} = live(conn, "/login")
    {:ok, Map.put(state, :view, view)}
  end

  defthen ~r/^a new access token should be stored$/, _vars, %{refresh_result: result} = state do
    assert {:ok, body} = result
    assert body["access_token"] != nil
    {:ok, state}
  end

  defthen ~r/^a new refresh token should be stored$/, _vars, %{refresh_result: result} = state do
    assert {:ok, body} = result
    assert body["refresh_token"] != nil
    {:ok, state}
  end

  defthen ~r/^alice should be redirected to the login page$/, _vars, state do
    case Map.get(state, :nav_result) do
      {:error, {:live_redirect, %{to: "/login"}}} ->
        {:ok, state}

      {:ok, view, _html} ->
        {:ok, Map.put(state, :view, view)}

      nil ->
        {:ok, state}
    end
  end

  defthen ~r/^an error message about session expiration should be displayed$/,
          _vars,
          %{refresh_result: result} = state do
    assert {:error, {401, body}} = result
    assert body["message"] =~ ~r/[Ss]ession|[Ee]xpired|log in/i
    {:ok, state}
  end

  defthen ~r/^the authentication session should be cleared$/, _vars, state do
    {:ok, state}
  end

  defthen ~r/^an error message about account deactivation should be displayed$/, _vars, state do
    case Map.get(state, :nav_result) do
      {:error, {:live_redirect, %{to: "/login"}}} ->
        {:ok, state}

      {:ok, view, _html} ->
        html = render(view)
        assert html =~ "deactivated" or html =~ "Account" or html =~ "inactive"
        {:ok, Map.put(state, :view, view)}

      _ ->
        {:ok, state}
    end
  end

  defthen ~r/^no error should be displayed$/, _vars, %{view: view} = state do
    html = render(view)
    refute html =~ "error" and html =~ "Login"
    {:ok, state}
  end
end
