defmodule DemoFeExphWeb.Router do
  use DemoFeExphWeb, :router

  alias DemoFeExphWeb.Plugs.AuthPlug
  alias DemoFeExphWeb.Plugs.RequireAuthPlug

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {DemoFeExphWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug AuthPlug
  end

  pipeline :require_auth do
    plug RequireAuthPlug
  end

  # Public routes — no authentication required
  scope "/", DemoFeExphWeb do
    pipe_through :browser

    live "/", HealthLive
    live "/login", LoginLive
    live "/register", RegisterLive
    live "/tokens", TokensLive
  end

  # Protected routes — authentication required
  scope "/", DemoFeExphWeb do
    pipe_through [:browser, :require_auth]

    live "/profile", ProfileLive
    live "/admin", AdminLive
    live "/expenses", ExpensesLive
    live "/expenses/summary", SummaryLive
  end

  if Mix.env() in [:dev, :test] do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser
      live_dashboard "/dashboard", metrics: DemoFeExphWeb.Telemetry
    end
  end
end
