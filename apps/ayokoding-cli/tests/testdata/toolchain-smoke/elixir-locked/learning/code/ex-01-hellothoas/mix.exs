defmodule Hellothoas.MixProject do
  use Mix.Project

  def project do
    [
      app: :hellothoas,
      version: "0.1.0",
      elixir: "~> 1.20",
      deps: [{:thoas, "1.2.1"}]
    ]
  end
end
