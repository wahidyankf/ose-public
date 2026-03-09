defmodule ElixirGherkin.Mixfile do
  use Mix.Project

  @version "2.0.0-ose.1"

  def project do
    [
      app: :elixir_gherkin,
      version: @version,
      elixir: "~> 1.3",
      source_url: "https://github.com/cabbage-ex/gherkin",
      homepage_url: "https://github.com/cabbage-ex/gherkin",
      build_embedded: Mix.env() == :prod,
      start_permanent: Mix.env() == :prod,
      description: "Gherkin file parser for Elixir (OSE fork of cabbage-ex/gherkin 2.0.0)",
      deps: deps(),
      aliases: aliases(),
      test_coverage: [tool: ExCoveralls],
      preferred_cli_env: [
        coveralls: :test,
        "coveralls.lcov": :test,
        "cover.lcov": :test
      ]
    ]
  end

  def application do
    [applications: [:logger, :runtime_tools]]
  end

  defp deps do
    [
      # Pin to 0.18.3 — 0.18.4+ has a code-path regression with Elixir 1.17.3 where
      # ExCoveralls module is not in the VM's code path at coverage-setup time.
      # Use the custom cover.lcov alias (below) which pre-starts :tools so
      # :cover.stop() does not fail on first use.
      {:excoveralls, "0.18.3", only: :test},
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false}
    ]
  end

  defp aliases do
    [
      # Workaround for Elixir 1.17.3 + ExCoveralls 0.18.x in Alpine Docker:
      #
      # Bug 1 — ExCoveralls module not in code path:
      #   Mix only adds :only-:test deps to the code path inside Mix.Tasks.Test.
      #   When Mix.Tasks.Test calls cover[:tool].start/2 at line 559, ExCoveralls
      #   is already the configured tool, but its main module may not yet be loaded.
      #   Fix: add _build/test/lib/*/ebin before running tests.
      #
      # Bug 2 — :cover gen_server not running:
      #   OTP's :tools ebin (containing :cover) is not in Mix's code path on Alpine.
      #   ExCoveralls.Cover.compile/1 calls :cover.stop() before :cover.start(),
      #   which fails if :cover has never been started.
      #   Fix: add OTP tools ebin via :code.root_dir() glob, then :cover.start().
      "cover.lcov": fn args ->
        Mix.Task.run("compile", [])
        build_dir = Mix.Project.build_path()

        # Bug 1 fix: ensure all test-dep ebins are in the code path before test run.
        # ExCoveralls and its transitive deps (jason, etc.) are :only-:test so Mix
        # does not add them to the code path until Mix.Tasks.Test runs — but that is
        # too late for the cover[:tool].start/2 call at mix/tasks/test.ex:559.
        Path.wildcard("#{build_dir}/lib/*/ebin")
        |> Enum.each(&:code.add_patha(to_charlist(&1)))

        # Bug 2 fix: add OTP tools ebin (:code.lib_dir(:tools) returns {:error,:bad_name}
        # in Alpine so we use root_dir + glob instead).
        root = :code.root_dir() |> to_string()

        case Path.wildcard("#{root}/lib/tools-*/ebin") do
          [tools_ebin | _] -> :code.add_patha(to_charlist(tools_ebin))
          _ -> :ok
        end

        :cover.start()
        Mix.Task.reenable("coveralls.lcov")
        Mix.Task.run("coveralls.lcov", args)
      end
    ]
  end
end
