defmodule AADemoBeExphWeb.Router do
  use AADemoBeExphWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
    plug AADemoBeExphWeb.CorsPlug
  end

  pipeline :auth do
    plug Guardian.Plug.Pipeline,
      module: ADemoBeExph.Auth.Guardian,
      error_handler: AADemoBeExphWeb.AuthErrorHandler

    plug Guardian.Plug.VerifyHeader, scheme: "Bearer"
    plug Guardian.Plug.EnsureAuthenticated
    plug AADemoBeExphWeb.Plugs.CheckRevoked
    plug AADemoBeExphWeb.Plugs.CheckUserActive
  end

  scope "/" do
    get "/health", AADemoBeExphWeb.HealthController, :index
    get "/.well-known/jwks.json", AADemoBeExphWeb.JwksController, :index
  end

  if System.get_env("ENABLE_TEST_API") == "true" do
    scope "/api/v1/test", AADemoBeExphWeb do
      pipe_through :api

      post "/reset-db", TestApiController, :reset_db
      post "/promote-admin", TestApiController, :promote_admin
    end
  end

  scope "/api/v1", AADemoBeExphWeb do
    pipe_through :api

    scope "/auth" do
      post "/register", AuthController, :register
      post "/login", AuthController, :login
      post "/refresh", AuthController, :refresh
      post "/logout", AuthController, :logout
      post "/logout-all", AuthController, :logout_all
    end

    scope "/" do
      pipe_through :auth

      scope "/users" do
        get "/me", UserController, :me
        patch "/me", UserController, :update_me
        post "/me/password", UserController, :change_password
        post "/me/deactivate", UserController, :deactivate
      end

      scope "/admin" do
        get "/users", AdminController, :list_users
        post "/users/:id/disable", AdminController, :disable_user
        post "/users/:id/enable", AdminController, :enable_user
        post "/users/:id/unlock", AdminController, :unlock_user
        post "/users/:id/force-password-reset", AdminController, :force_password_reset
      end

      scope "/expenses" do
        get "/", ExpenseController, :index
        post "/", ExpenseController, :create
        get "/summary", ExpenseController, :summary
        get "/:id", ExpenseController, :show
        put "/:id", ExpenseController, :update
        delete "/:id", ExpenseController, :delete

        scope "/:expense_id/attachments" do
          get "/", AttachmentController, :index
          post "/", AttachmentController, :create
          get "/:att_id", AttachmentController, :show
          delete "/:att_id", AttachmentController, :delete
        end
      end

      scope "/reports" do
        get "/pl", ReportController, :pl
      end
    end
  end
end
