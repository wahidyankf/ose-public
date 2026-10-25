# => Example 74: read dispatch by asking which impl the value selects.
# => The protocol is redeclared small so this drill stands alone.
defprotocol Greeter do # => the greeting contract protocol.
  # => @doc on the protocol function states the contract implementers meet.
  @doc "Greets any greetable value with its own convention." # => the implementer contract.
  def greet(value) # => one function, every type greets.
end # => the protocol closes; dispatch is now open.
# => The BitString impl greets plain text with the plain convention.
defimpl Greeter, for: BitString do # => the text implementation module.
  def greet(name), do: "hello #{name}" # => greet text plainly.
end # => the BitString impl closes.
# => The Atom impl greets with a marker so dispatch stays visible.
defimpl Greeter, for: Atom do # => the atom implementation module.
  def greet(name), do: "hello #{name}, the atom" # => greet atoms with a marker.
end # => the Atom impl closes.
# => Reading step one: name the value's type before guessing the outcome.
IO.puts("string=#{Greeter.greet("ada")} atom=#{Greeter.greet(:ada)}") # => type-first greetings.
# => Reading step two: impls are modules; the protocol finds them, not you.
IO.puts("impl_string=#{inspect(Greeter.impl_for("ada"))} impl_atom=#{inspect(Greeter.impl_for(:ada))}") # => the dispatch proof.
