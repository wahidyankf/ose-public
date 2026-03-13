defmodule DemoBeExph.MixProject do
  use Mix.Project

  def project do
    [
      app: :demo_be_exph,
      version: "0.1.0",
      elixir: "~> 1.15",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps(),
      listeners: [Phoenix.CodeReloader],
      test_coverage: [tool: ExCoveralls],
      test_paths: test_paths(Mix.env()),
      test_pattern: "**/*_{test,steps}.exs",
      test_load_filters: [~r/_test\.exs$/, ~r/_steps\.exs$/],
      preferred_cli_env: [
        coveralls: :test,
        "coveralls.lcov": :test
      ]
    ]
  end

  # Configuration for the OTP application.
  def application do
    [
      mod: {DemoBeExph.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  def cli do
    [
      preferred_envs: [
        precommit: :test,
        "test:unit": :test,
        "test:integration": :integration
      ]
    ]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(:integration), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  # Specifies test paths per environment.
  # :integration runs only the integration step definitions (real PostgreSQL via docker).
  # :test runs unit steps, existing unit tests, and controller coverage tests.
  defp test_paths(:integration), do: ["test/integration"]
  defp test_paths(_), do: ["test"]

  # Specifies your project dependencies.
  defp deps do
    [
      # Phoenix framework + Ecto
      {:phoenix, "~> 1.7"},
      {:phoenix_ecto, "~> 4.5"},
      {:ecto_sql, "~> 3.12"},
      {:postgrex, ">= 0.0.0"},
      {:telemetry_metrics, "~> 1.0"},
      {:telemetry_poller, "~> 1.0"},
      {:gettext, "~> 1.0"},
      {:jason, "~> 1.2"},
      {:dns_cluster, "~> 0.2.0"},
      # Phoenix 1.7+ defaults to Bandit (not Cowboy)
      {:bandit, "~> 1.5"},
      # Auth: JWT + password hashing
      {:guardian, "~> 2.3"},
      {:bcrypt_elixir, "~> 3.0"},
      # Test / BDD — vendored forks (local path deps, not Hex)
      {:elixir_gherkin, path: "../../libs/elixir-gherkin", only: [:test, :integration]},
      {:elixir_cabbage, path: "../../libs/elixir-cabbage", only: [:test, :integration]},
      {:excoveralls, "~> 0.18", only: :test},
      # Dev / quality
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false}
    ]
  end

  defp aliases do
    [
      setup: ["deps.get", "ecto.setup"],
      "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      precommit: ["compile --warnings-as-errors", "deps.unlock --unused", "format", "test"]
    ]
  end
end
