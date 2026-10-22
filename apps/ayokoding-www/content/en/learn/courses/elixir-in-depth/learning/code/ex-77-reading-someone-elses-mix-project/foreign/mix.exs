defmodule Foreign.MixProject do
  use Mix.Project

  def project do
    [app: :foreign, version: "0.2.0", deps: [{:plug, "~> 1.16"}]]
  end
end
