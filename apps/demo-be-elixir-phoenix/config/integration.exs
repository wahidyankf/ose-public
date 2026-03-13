import Config

# Integration test environment — used by Dockerfile.integration.
# Uses real PostgreSQL (DATABASE_URL injected by docker-compose).
# Does NOT override context modules with in-memory implementations.

config :demo_be_exph, DemoBeExphWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "9nYAOfW0t4BGQgRMTz9Wo7C9vwlrhrSLoIfWbZK8fxxz6E4ehacBRt29myR/Hi3o",
  server: false

# Guardian — APP_JWT_SECRET is required (supplied by docker-compose).
config :demo_be_exph, DemoBeExph.Auth.Guardian,
  issuer: "demo_be_exph",
  ttl: {24, :hours}

# Elixir Cabbage BDD — specs volume mounted at /specs by docker-compose.
config :elixir_cabbage, features: "/specs/apps/demo-be/gherkin/"

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime

config :phoenix,
  sort_verified_routes_query_params: true
