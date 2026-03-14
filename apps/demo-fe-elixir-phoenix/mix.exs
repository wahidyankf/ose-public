defmodule DemoFeExph.MixProject do
  use Mix.Project

  def project do
    [
      app: :demo_fe_exph,
      version: "0.1.0",
      elixir: "~> 1.19",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps(),
      test_coverage: [tool: ExCoveralls],
      test_pattern: "**/*_{test,steps}.exs",
      test_load_filters: [~r/_test\.exs$/, ~r/_steps\.exs$/]
    ]
  end

  def cli do
    [
      preferred_envs: [
        coveralls: :test,
        "coveralls.detail": :test,
        "coveralls.html": :test,
        "coveralls.lcov": :test
      ]
    ]
  end

  def application do
    [
      mod: {DemoFeExph.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  defp deps do
    [
      {:phoenix, "~> 1.8.5"},
      {:phoenix_html, "~> 4.2"},
      {:phoenix_live_reload, "~> 1.6", only: :dev},
      {:phoenix_live_view, "~> 1.1.27"},
      {:phoenix_live_dashboard, "~> 0.8"},
      {:telemetry_metrics, "~> 1.1"},
      {:telemetry_poller, "~> 1.1"},
      {:jason, "~> 1.4"},
      {:bandit, "~> 1.7"},
      {:req, "~> 0.5"},
      {:lazy_html, ">= 0.1.0", only: :test},
      {:excoveralls, "~> 0.18", only: :test},
      {:elixir_cabbage, path: "../../libs/elixir-cabbage", only: :test},
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
      {:esbuild, "~> 0.9", runtime: Mix.env() == :dev},
      {:tailwind, "~> 0.3", runtime: Mix.env() == :dev}
    ]
  end

  defp aliases do
    [
      setup: ["deps.get", "assets.setup", "assets.build"],
      "assets.setup": ["tailwind.install --if-missing", "esbuild.install --if-missing"],
      "assets.build": ["tailwind demo_fe_exph", "esbuild demo_fe_exph"],
      "assets.deploy": [
        "tailwind demo_fe_exph --minify",
        "esbuild demo_fe_exph --minify",
        "phx.digest"
      ]
    ]
  end
end
