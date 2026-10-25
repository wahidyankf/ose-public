# => single project file every unit shares byte for byte
defmodule App.MixProject do
  # => Mix drives deps, compile, and the script run
  use Mix.Project

  # => project metadata the harness never prints
  def project do
    # => keyword list, formatter-stable at this width
    [
      # => application name, never started as an OTP app
      app: :app,
      # => fixed version, never reaches stdout
      version: "0.1.0",
      # => floor the toolchain image satisfies
      elixir: "~> 1.18",
      # => standard Mix default
      start_permanent: Mix.env() == :prod,
      # => the six pinned libraries below
      deps: deps()
      # => end project: five keys, nothing environment-specific
    ]

    # => end project: metadata only
  end

  # => runtime applications the script needs
  def application do
    # => keyword list with a single key
    [
      # => Logger for the level the script sets
      extra_applications: [:logger]
      # => end application: no mod, the script starts servers itself
    ]

    # => end application: the probe proved mod breaks harness runs
  end

  # => private function keeps the pinned set in one place
  defp deps do
    # => six direct dependencies, locked by learning/code/mix.lock
    [
      # => routes, controllers, channels, and presence
      {:phoenix, "== 1.8.16"},
      # => mount, render, events, and streams in-process
      {:phoenix_live_view, "== 1.2.13"},
      # => HTML helpers behind LiveView templates
      {:phoenix_html, "== 4.3.0"},
      # => changeset validation without a database
      {:ecto, "== 3.14.2"},
      # => JSON bodies for controller answers
      {:jason, "== 1.4.5"},
      # => changeset-to-form bridge for form handling
      {:phoenix_ecto, "== 4.7.0"}
      # => end deps: exact pins, the lock carries the checksums
    ]

    # => end deps: nothing else may enter this list
  end

  # => end App.MixProject: the whole project file
end
