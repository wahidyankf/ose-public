# => Example 72: read a with chain by listing every else branch first.
defmodule Loader do # => the two-failure-shape loader module.
  # => Two failure shapes exist: fetch misses and partial parses.
  def load(name, store) do # => the load function both reports share.
    with {:ok, raw} <- Map.fetch(store, name), # => step one fetches the raw string.
         {n, ""} <- Integer.parse(raw) do # => step two parses it fully.
      {:ok, n * 2} # => the doubled happy value.
    else # => short-circuits land here, matched by value.
      # => Both parse failures and fetch misses surface here as data.
      :error -> {:error, :missing} # => fetch misses and bad parses share this.
      {_n, _rest} -> {:error, :not_a_number} # => partial parses take this branch.
    end # => the with closes; one tuple comes out either way.
  end # => the load function closes.
end # => the module closes; Loader.load is now callable.
# => Good input doubles; partial parses and misses take separate branches.
store = %{"good" => "21", "partial" => "21x", "bad" => "x"} # => the three-case fixture store.
# => The bad string parses to :error, so it shares the missing branch.
IO.puts("good=#{inspect(Loader.load("good", store))} partial=#{inspect(Loader.load("partial", store))}") # => good and partial reports.
# => Missing keys and unparseable strings converge: absence by any cause.
IO.puts("missing=#{inspect(Loader.load("nope", store))} bad=#{inspect(Loader.load("bad", store))}") # => missing and bad reports.
