# => Example 49: updates return new values; old bindings keep the old data.
cart = %{items: ["book"], total: 20} # => the original cart both updates start from.
# => put_in nests the update; the original map binding never changes.
added = put_in(cart, [:items], cart.items ++ ["pen"]) # => pen added; cart untouched.
# => update_in transforms with a function while the old value persists.
priced = update_in(added, [:total], fn t -> t + 5 end) # => total plus five; added untouched.
# => get_and_update returns both the old value and the new structure.
{old_total, bumped} = Map.get_and_update(priced, :total, fn t -> {t, t + 1} end) # => pop 25, install 26.
# => Nested access paths compose; Access.key guards missing levels safely.
deep = %{a: %{b: 1}} # => the fixed nested fixture.
deepened = update_in(deep, [:a, :b], fn x -> x * 10 end) # => deep value times ten.
# => Print the lineage: original, added, priced, bumped, and the deep edit.
IO.puts("orig_items=#{length(cart.items)} added=#{inspect(added.items)} priced=#{priced.total}") # => the update lineage.
# => The popped old total and the untouched-then-deepened values close the tale.
IO.puts("old=#{old_total} bumped=#{bumped.total} deep=#{deepened.a.b}") # => popped, bumped, and deepened values.
