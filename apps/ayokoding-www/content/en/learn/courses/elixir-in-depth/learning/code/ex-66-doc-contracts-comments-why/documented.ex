defmodule Documented do
  @moduledoc "A sample module with documented public entries."
  @doc "Doubles the input; raises nothing."
  def double(n), do: n * 2
  @doc "Halves the input; integer division truncates."
  def half(n), do: div(n, 2)
end
