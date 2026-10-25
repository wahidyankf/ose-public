# => Example 5: maps hold data, keywords hold options, structs fix the keys.
user = %{name: "ada", roles: [:admin]} # => the open-data map the updates start from.
# => Put returns a new map; the original binding keeps the old value.
renamed = Map.put(user, :name, "grace") # => a new map; user still says ada.
# => Keyword lists allow duplicate keys; get_values collects every one.
opts = [level: :debug, level: :info] # => options tolerate the duplicated key.
# => Structs declare their fields up front, so typos fail at compile time.
defmodule Account do # => the fixed-shape domain unit.
  # => defstruct lists allowed keys with their defaults in one place.
  defstruct [:owner, balance: 0] # => owner enforced, balance defaults to zero.
end # => the module closes; Account is now a struct type.
# => Percent-brace with the module name builds with defaults filled in.
ada = struct!(Account, owner: "ada", balance: 100) # => strict build, unknown keys raise.
# => Update syntax keeps the struct tag while replacing named fields.
richer = %{ada | balance: 150} # => same owner, new balance, struct intact.
# => Print old versus new names, the duplicated option, and struct fields.
IO.puts("old=#{user.name} new=#{renamed.name} levels=#{inspect(Keyword.get_values(opts, :level))}") # => old kept, new set, both levels.
# => The struct update changed balance and kept the owner untouched.
IO.puts("owner=#{richer.owner} balance=#{richer.balance}") # => the targeted update proof.
