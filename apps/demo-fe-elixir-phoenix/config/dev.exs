import Config

config :demo_fe_exph, DemoFeExphWeb.Endpoint,
  http: [ip: {0, 0, 0, 0}, port: 3301],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base:
    "dev_secret_key_base_that_is_at_least_64_bytes_long_for_development_only_do_not_use",
  watchers: [
    esbuild: {Esbuild, :install_and_run, [:demo_fe_exph, ~w(--sourcemap=inline --watch)]},
    tailwind: {Tailwind, :install_and_run, [:demo_fe_exph, ~w(--watch)]}
  ]

config :demo_fe_exph, DemoFeExphWeb.Endpoint,
  live_reload: [
    patterns: [
      ~r"priv/static/(?!uploads/).*(js|css|png|jpeg|jpg|gif|svg)$",
      ~r"lib/demo_fe_exph_web/(controllers|live|components)/.*(ex|heex)$"
    ]
  ]

config :demo_fe_exph, :backend_url, "http://localhost:8201"
