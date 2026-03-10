import Config

# Configure your database
#
# The MIX_TEST_PARTITION environment variable can be used
# to provide built-in test partitioning in CI environment.
# Run `mix help test` for more information.
config :organiclever_be_exph, OrganicleverBeExph.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "organiclever_be_exph_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :organiclever_be_exph, OrganicleverBeExphWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "9nYAOfW0t4BGQgRMTz9Wo7C9vwlrhrSLoIfWbZK8fxxz6E4ehacBRt29myR/Hi3o",
  server: false

# Accounts mock — injected for integration tests (Mox, no external DB)
config :organiclever_be_exph, :accounts_impl, OrganicleverBeExph.MockAccounts

# Guardian test secret — overrides runtime.exs so APP_JWT_SECRET is not required during tests
# config/test.exs is evaluated before runtime.exs, taking precedence in the test env.
config :organiclever_be_exph, OrganicleverBeExph.Auth.Guardian,
  secret_key: "test_secret_do_not_use_in_production"

# Elixir Cabbage BDD — feature files relative to workspace root
config :elixir_cabbage,
  features: Path.expand("../../../specs/apps/organiclever-be/", __DIR__) <> "/"

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime

# Sort query params output of verified routes for robust url comparisons
config :phoenix,
  sort_verified_routes_query_params: true
