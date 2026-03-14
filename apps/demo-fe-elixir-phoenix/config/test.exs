import Config

config :demo_fe_exph, DemoFeExphWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base:
    "test_secret_key_base_that_is_at_least_64_bytes_long_for_testing_only_do_not_use",
  server: false

config :demo_fe_exph, :backend_url, "http://localhost:8201"

config :logger, level: :warning

config :elixir_cabbage, features: "../../specs/apps/demo/fe/gherkin/"

config :demo_fe_exph, :api_client, DemoFeExph.Test.MockApi.Client
config :demo_fe_exph, :api_auth, DemoFeExph.Test.MockApi.Auth
config :demo_fe_exph, :api_users, DemoFeExph.Test.MockApi.Users
config :demo_fe_exph, :api_admin, DemoFeExph.Test.MockApi.Admin
config :demo_fe_exph, :api_expenses, DemoFeExph.Test.MockApi.Expenses
config :demo_fe_exph, :api_attachments, DemoFeExph.Test.MockApi.Attachments
config :demo_fe_exph, :api_reports, DemoFeExph.Test.MockApi.Reports
config :demo_fe_exph, :api_tokens, DemoFeExph.Test.MockApi.Tokens
