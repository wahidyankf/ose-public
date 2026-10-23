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
      # => the two pinned libraries below
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
      # => end application: no mod, the script starts the Repo itself
    ]

    # => end application: the probe proved mod breaks harness runs
  end

  # => private function keeps the pinned set in one place
  defp deps do
    # => two direct dependencies, locked by learning/code/mix.lock
    [
      # => migrations, Repo, and the Postgres adapter
      {:ecto_sql, "== 3.14.0"},
      # => the wire driver the adapter speaks through
      {:postgrex, "== 0.22.4"}
      # => end deps: exact pins, the lock carries the checksums
    ]

    # => end deps: nothing else may enter this list
  end

  # => end App.MixProject: the whole project file
end
