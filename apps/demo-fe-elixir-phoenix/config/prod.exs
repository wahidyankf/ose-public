import Config

config :demo_fe_exph, DemoFeExphWeb.Endpoint,
  cache_static_manifest: "priv/static/cache_manifest.json"

config :logger, level: :info
