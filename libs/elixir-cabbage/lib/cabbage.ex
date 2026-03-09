defmodule Cabbage do
  @moduledoc """
  """
  def base_path(), do: Application.get_env(:elixir_cabbage, :features, "test/features/")
  def global_tags(), do: Application.get_env(:elixir_cabbage, :global_tags, []) |> List.wrap()
end
