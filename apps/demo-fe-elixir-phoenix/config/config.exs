import Config

config :demo_fe_exph, DemoFeExphWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [html: DemoFeExphWeb.ErrorHTML],
    layout: false
  ],
  pubsub_server: DemoFeExph.PubSub,
  live_view: [signing_salt: "demo_fe_exph_salt"]

config :esbuild,
  version: "0.25.0",
  demo_fe_exph: [
    args:
      ~w(js/app.js --bundle --target=es2017 --outdir=../priv/static/assets --external:/fonts/* --external:/images/*),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
  ]

config :tailwind,
  version: "3.4.17",
  demo_fe_exph: [
    args:
      ~w(--config=tailwind.config.js --input=css/app.css --output=../priv/static/assets/app.css),
    cd: Path.expand("../assets", __DIR__)
  ]

config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

config :phoenix, :json_library, Jason

import_config "#{config_env()}.exs"
