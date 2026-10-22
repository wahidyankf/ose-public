# => Example 28: structs fix the shape; changes stay explicit updates.
defmodule LineItem do # => the line-item domain shape.
  # => enforce_keys turns missing fields into a construction-time error.
  @enforce_keys [:sku] # => sku has no default; builders must supply it.
  defstruct [:sku, qty: 1, price: 0.0] # => three allowed keys with defaults.
end # => the module closes; LineItem is now a struct type.
# => struct! raises on unknown keys, so typos fail fast at construction.
item = struct!(LineItem, sku: "book", qty: 2, price: 9.5) # => strict build with all fields.
# => Update syntax keeps the struct tag while replacing named fields.
bulk = %{item | qty: 10} # => same book, ten copies, tag intact.
# => Dot access reads fields and raises on missing keys by design.
IO.puts("sku=#{bulk.sku} qty=#{bulk.qty} line=#{bulk.qty * bulk.price}") # => the line-item read and total.
# => from_struct drops the tag; fields print explicitly, never as a map.
plain = Map.from_struct(bulk) # => the tagless plain map.
IO.puts("plain_sku=#{plain.sku} plain_qty=#{plain.qty} plain_price=#{plain.price}") # => the boundary-safe fields.
