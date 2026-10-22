# => Example 46: behaviours declare callbacks; modules opt in explicitly.
defmodule Store do # => the store contract module.
  # => @callback fixes the arity and the return shape implementers promise.
  @callback fetch(map(), term()) :: {:ok, term()} | {:error, :missing} # => the fetch contract.
  @callback keys(map()) :: [term()] # => the keys contract.
end # => the contract module closes; two callbacks declared.
# => @behaviour announces the contract; the compiler warns on gaps.
defmodule MemoryStore do # => the in-memory implementer.
  @behaviour Store # => opt into the contract; gaps warn at compile time.
  # => fetch matches the callback shape exactly, atom for atom.
  @impl Store # => tie this function to its callback.
  def fetch(state, key) do # => the fetch implementation.
    case Map.fetch(state, key) do # => match the fetch result shape.
      {:ok, _} = hit -> hit # => pass hits through untouched.
      :error -> {:error, :missing} # => convert misses to the contract error.
    end # => the case closes; the contract shape holds either way.
  end # => the fetch function closes.
  # => @impl ties each function to its callback so renames break loudly.
  @impl Store # => tie this function to its callback.
  def keys(state), do: Map.keys(state) |> Enum.sort() # => sorted keys for determinism.
end # => the implementer closes; both callbacks met.
# => The caller programs to the behaviour, not to the MemoryStore name.
state = %{"b" => 2, "a" => 1} # => the fixed backing store.
# => Callbacks compose into reports without knowing the backing store.
IO.puts("fetch=#{inspect(MemoryStore.fetch(state, "a"))} miss=#{inspect(MemoryStore.fetch(state, "z"))}") # => hit and miss reports.
# => Sorted keys keep the report deterministic across map orderings.
IO.puts("keys=#{inspect(MemoryStore.keys(state))}") # => the sorted key report.
