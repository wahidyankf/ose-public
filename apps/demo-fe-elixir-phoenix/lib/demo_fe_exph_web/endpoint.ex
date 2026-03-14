defmodule DemoFeExphWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :demo_fe_exph

  @session_options [
    store: :cookie,
    key: "_demo_fe_exph_key",
    signing_salt: "demo_fe_exph",
    same_site: "Lax"
  ]

  socket "/live", Phoenix.LiveView.Socket,
    websocket: [connect_info: [session: @session_options]],
    longpoll: false

  plug Plug.Static,
    at: "/",
    from: :demo_fe_exph,
    gzip: false,
    only: DemoFeExphWeb.static_paths()

  if code_reloading? do
    socket "/phoenix/live_reload/socket", Phoenix.LiveReloader.Socket
    plug Phoenix.LiveReloader
    plug Phoenix.CodeReloader
  end

  plug Phoenix.LiveDashboard.RequestLogger,
    param_key: "request_logger",
    cookie_key: "request_logger"

  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library(),
    length: 20_000_000

  plug Plug.MethodOverride
  plug Plug.Head
  plug Plug.Session, @session_options
  plug DemoFeExphWeb.Router
end
