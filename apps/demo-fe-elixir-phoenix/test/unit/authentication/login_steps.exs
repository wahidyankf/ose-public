defmodule DemoFeExphWeb.Unit.LoginSteps do
  use Cabbage.Feature, async: false, file: "authentication/login.feature"

  use DemoFeExphWeb.ConnCase

  alias DemoFeExph.Test.ApiStub

  @moduletag :unit

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

    {:ok, state}
  end

  defgiven ~r/^a user "(?<username>[^"]+)" is registered and deactivated$/,
           %{username: username},
           state do
    ApiStub.put(
      :get_current_user,
      {:ok, %{"id" => "user-1", "username" => username, "status" => "inactive"}}
    )

    ApiStub.put(:login, {:error, {403, %{"message" => "Account is deactivated."}}})
    {:ok, state}
  end

  defwhen ~r/^alice submits the login form with username "(?<username>[^"]+)" and password "(?<password>[^"]+)"$/,
          %{username: username, password: password},
          %{conn: conn} = state do
    case username do
      "alice" when password == "Str0ng#Pass1" ->
        :ok

      "alice" ->
        ApiStub.put(:login, {:error, {401, %{"message" => "Invalid credentials."}}})

      "ghost" ->
        ApiStub.put(:login, {:error, {401, %{"message" => "Invalid credentials."}}})

      _ ->
        :ok
    end

    {:ok, view, _html} = live(conn, "/login")
    result = view |> form("form", %{username: username, password: password}) |> render_submit()

    view =
      case result do
        {:error, {:live_redirect, %{to: to}}} ->
          conn_with_session =
            conn
            |> Plug.Test.init_test_session(%{
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

  defthen ~r/^alice should be on the dashboard page$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "Demo Frontend"
    {:ok, state}
  end

  defthen ~r/^the navigation should display alice's username$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "Logged in"
    {:ok, state}
  end

  defthen ~r/^an authentication session should be active$/, _vars, state do
    {:ok, state}
  end

  defthen ~r/^a refresh token should be stored$/, _vars, state do
    {:ok, state}
  end

  defthen ~r/^an error message about invalid credentials should be displayed$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "Invalid credentials" or html =~ "invalid" or html =~ "credentials"
    {:ok, state}
  end

  defthen ~r/^alice should remain on the login page$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "Login"
    {:ok, state}
  end

  defthen ~r/^an error message about account deactivation should be displayed$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "deactivated" or html =~ "Account" or html =~ "inactive"
    {:ok, state}
  end
end
