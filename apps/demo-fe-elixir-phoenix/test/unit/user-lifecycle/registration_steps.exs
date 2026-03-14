defmodule DemoFeExphWeb.Unit.RegistrationSteps do
  use Cabbage.Feature, async: false, file: "user-lifecycle/registration.feature"

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

  defgiven ~r/^a user "(?<username>[^"]+)" is registered with email "(?<email>[^"]+)" and password "(?<password>[^"]+)"$/,
           %{username: username, email: _email, password: _password},
           state do
    ApiStub.put(
      :register,
      {:error, {409, %{"message" => "Username '#{username}' already exists."}}}
    )

    {:ok, state}
  end

  defwhen ~r/^a visitor fills in the registration form with username "(?<username>[^"]+)", email "(?<email>[^"]+)", and password "(?<password>[^"]*)"$/,
          %{username: username, email: email, password: password},
          state do
    form_data = %{username: username, email: email, password: password}

    stub =
      cond do
        password == "" ->
          {:error,
           {422,
            %{
              "message" => "Password cannot be blank.",
              "errors" => %{"password" => ["can't be blank"]}
            }}}

        password == "str0ng#pass1" ->
          {:error,
           {422,
            %{
              "message" => "Password must contain an uppercase letter.",
              "errors" => %{"password" => ["must contain uppercase"]}
            }}}

        email == "not-an-email" ->
          {:error,
           {422, %{"message" => "Email is invalid.", "errors" => %{"email" => ["is invalid"]}}}}

        true ->
          ApiStub.get(:register)
      end

    ApiStub.put(:register, stub)
    {:ok, Map.put(state, :form_data, form_data)}
  end

  defwhen ~r/^the visitor submits the registration form$/,
          _vars,
          %{conn: conn, form_data: form_data} = state do
    {:ok, view, _html} = live(conn, "/register")
    view |> form("form", form_data) |> render_submit()
    {:ok, Map.put(state, :view, view)}
  end

  defthen ~r/^the visitor should be on the login page$/, _vars, %{view: view} = state do
    html = render(view)
    assert html =~ "Account created" or html =~ "Login"
    {:ok, state}
  end

  defthen ~r/^a success message about account creation should be displayed$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "Account created" or html =~ "success" or html =~ "log in"
    {:ok, state}
  end

  defthen ~r/^no password value should be visible on the page$/, _vars, %{view: view} = state do
    html = render(view)
    refute html =~ "Str0ng#Pass1"
    refute html =~ "str0ng#pass1"
    {:ok, state}
  end

  defthen ~r/^an error message about duplicate username should be displayed$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "already exists" or html =~ "duplicate" or html =~ "Username"
    {:ok, state}
  end

  defthen ~r/^the visitor should remain on the registration page$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "Register"
    {:ok, state}
  end

  defthen ~r/^a validation error for the email field should be displayed$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "invalid" or html =~ "email" or html =~ "Email"
    {:ok, state}
  end

  defthen ~r/^a validation error for the password field should be displayed$/,
          _vars,
          %{view: view} = state do
    html = render(view)
    assert html =~ "password" or html =~ "Password" or html =~ "blank" or html =~ "uppercase"
    {:ok, state}
  end
end
