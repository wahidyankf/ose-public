# => Example 65: snake_case, ? predicates, ! bangs: names carry contracts.
defmodule Naming do # => the one-contract naming module.
  # => Predicate functions end in ? and return exactly true or false.
  def member?(roles, role), do: role in roles # => ask membership, get a boolean.
  # => Bang functions raise on failure; the plain twin returns a tuple.
  def fetch!(map, key) do # => the demanding fetch implementation.
    case Map.fetch(map, key) do # => match the fetch result shape.
      {:ok, v} -> v # => return the value on the happy path.
      :error -> raise KeyError, key: key, term: map # => raise with key context.
    end # => the case closes; value or raise, never a tuple.
  end # => the bang function closes.
  # => fetch returns the tuple the bang refuses to return.
  def fetch(map, key), do: Map.fetch(map, key) # => the plain handling twin.
end # => the module closes; ask, demand, and handle coexist.
# => The three names read as one contract: ask, demand, or handle.
IO.puts("member=#{Naming.member?([:admin], :admin)} fetch=#{inspect(Naming.fetch(%{a: 1}, :a))}") # => ask and handle answers.
# => The bang returns the value when the key exists, by definition.
IO.puts("bang=#{Naming.fetch!(%{a: 1}, :a)}") # => demand answered with 1.
