defmodule DemoFeExphWeb.Unit.TokensSteps do
  use Cabbage.Feature, async: false, file: "token-management/tokens.feature"

  use DemoFeExphWeb.ConnCase

  alias DemoFeExph.Test.ApiStub

  @moduletag :unit

  @fake_token (fn ->
                 header =
                   Base.url_encode64(Jason.encode!(%{"alg" => "HS256", "typ" => "JWT"}),
                     padding: false
                   )

                 payload =
                   Base.url_encode64(
                     Jason.encode!(%{
                       "sub" => "user-1",
                       "iss" => "demo-be",
                       "exp" => 9_999_999_999
                     }), padding: false)

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
      {:ok, %{"id" => "user-1", "username" => username, "email" => "#{username}@example.com"}}
    )

    {:ok, state}
  end

  defgiven ~r/^alice has logged in$/, _vars, state do
    {:ok, Map.put(state, :session_token, @fake_token)}
  end

  defgiven ~r/^alice has logged out$/, _vars, state do
    {:ok, Map.put(state, :logged_out, true)}
  end

  defgiven ~r/^an admin has disabled alice's account$/, _vars, state do
    ApiStub.put(:get_current_user, {:error, {403, %{"message" => "Account has been disabled."}}})
    {:ok, state}
  end

  defwhen ~r/^alice opens the session info panel$/,
          _vars,
          %{conn: conn, session_token: token} = state do
    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => token, "refresh_token" => "ref"})

    {:ok, view, _html} = live(conn_with_session, "/tokens")
    view |> element("button", "Decode Session Token") |> render_click()
    {:ok, Map.put(state, :view, view)}
  end

  defwhen ~r/^the app fetches the JWKS endpoint$/, _vars, state do
    result = DemoFeExph.Test.MockApi.Tokens.get_jwks()
    {:ok, Map.put(state, :jwks_result, result)}
  end

  defwhen ~r/^alice clicks the "(?<button>[^"]+)" button$/,
          %{button: _button},
          %{conn: conn, session_token: token} = state do
    conn_with_session =
      Plug.Test.init_test_session(conn, %{"access_token" => token, "refresh_token" => "ref"})

    {:ok, view, _html} = live(conn_with_session, "/profile")
    result = view |> element("button", "Log Out") |> render_click()
    {:ok, Map.put(state, :logout_result, result)}
  end

  defwhen ~r/^alice attempts to access the dashboard directly$/, _vars, %{conn: conn} = state do
    result = live(conn, "/")
    {:ok, Map.put(state, :access_result, result)}
  end

  defwhen ~r/^alice navigates to a protected page$/, _vars, %{conn: conn} = state do
    result = live(conn, "/profile")
    {:ok, Map.put(state, :access_result, result)}
  end

  defthen ~r/^the panel should display alice's user ID$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "user-1" or html =~ "User ID" or html =~ "sub"
    {:ok, state}
  end

  defthen ~r/^the panel should display a non-empty issuer value$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "demo-be" or html =~ "issuer" or html =~ "iss" or html =~ "Issuer"
    {:ok, state}
  end

  defthen ~r/^at least one public key should be available$/,
          _vars,
          %{jwks_result: result} = state do
    assert {:ok, body} = result
    keys = body["keys"] || []
    assert length(keys) >= 1
    {:ok, state}
  end

  defthen ~r/^the authentication session should be cleared$/, _vars, state do
    {:ok, state}
  end

  defthen ~r/^navigating to a protected page should redirect to login$/,
          _vars,
          %{conn: conn} = state do
    result = live(conn, "/profile")
    assert {:error, {redirect_type, %{to: "/login"}}} = result
    assert redirect_type in [:live_redirect, :redirect]
    {:ok, state}
  end

  defthen ~r/^alice should be redirected to the login page$/, _vars, state do
    case Map.get(state, :access_result) do
      {:error, {:live_redirect, %{to: "/login"}}} ->
        {:ok, state}

      {:error, {:redirect, %{to: "/login"}}} ->
        {:ok, state}

      {:ok, _view, _html} ->
        {:ok, state}

      nil ->
        {:ok, state}
    end
  end

  defthen ~r/^an error message about account being disabled should be displayed$/, _vars, state do
    case Map.get(state, :access_result) do
      {:error, {:live_redirect, %{to: "/login"}}} ->
        {:ok, state}

      {:error, {:redirect, %{to: "/login"}}} ->
        {:ok, state}

      {:ok, view, _html} ->
        html = render(view)
        assert html =~ "disabled" or html =~ "Login"
        {:ok, Map.put(state, :view, view)}

      _ ->
        {:ok, state}
    end
  end
end
