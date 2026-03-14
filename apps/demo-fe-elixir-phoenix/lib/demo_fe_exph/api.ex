defmodule DemoFeExph.Api do
  @moduledoc """
  Facade for API module resolution.

  In production, delegates to the real API modules. In test, the application
  config may override individual modules with mock implementations.

      # config/test.exs
      config :demo_fe_exph, :api_auth, DemoFeExph.Test.MockApi.Auth
      config :demo_fe_exph, :api_users, DemoFeExph.Test.MockApi.Users
      # etc.
  """

  @doc "Returns the configured Auth API module."
  def auth_module do
    Application.get_env(:demo_fe_exph, :api_auth, DemoFeExph.Api.Auth)
  end

  @doc "Returns the configured Users API module."
  def users_module do
    Application.get_env(:demo_fe_exph, :api_users, DemoFeExph.Api.Users)
  end

  @doc "Returns the configured Admin API module."
  def admin_module do
    Application.get_env(:demo_fe_exph, :api_admin, DemoFeExph.Api.Admin)
  end

  @doc "Returns the configured Expenses API module."
  def expenses_module do
    Application.get_env(:demo_fe_exph, :api_expenses, DemoFeExph.Api.Expenses)
  end

  @doc "Returns the configured Attachments API module."
  def attachments_module do
    Application.get_env(:demo_fe_exph, :api_attachments, DemoFeExph.Api.Attachments)
  end

  @doc "Returns the configured Reports API module."
  def reports_module do
    Application.get_env(:demo_fe_exph, :api_reports, DemoFeExph.Api.Reports)
  end

  @doc "Returns the configured Tokens API module."
  def tokens_module do
    Application.get_env(:demo_fe_exph, :api_tokens, DemoFeExph.Api.Tokens)
  end

  @doc "Returns the configured Client API module."
  def client_module do
    Application.get_env(:demo_fe_exph, :api_client, DemoFeExph.Api.Client)
  end
end
