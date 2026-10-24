# => Example 61: choose the primitive by lifetime, sharing, and failure needs.
defmodule Guide do # => the total-decision guide module.
  # => The decision reads as data: each need maps to exactly one primitive.
  def pick(%{share: :none}), do: :task # => no sharing: one-shot tasks.
  def pick(%{share: :state, restart: false}), do: :agent # => state, no restart: agents.
  def pick(%{share: :state, restart: true}), do: :genserver # => state plus restart: servers.
  def pick(%{share: :named}), do: :registry # => named access: registries.
end # => the guide module closes; pick is now total.
# => One-shot parallel work needs no sharing: tasks await and vanish.
IO.puts("parallel=#{Guide.pick(%{share: :none})}") # => parallel work takes tasks.
# => Plain shared state with no restart story is an agent, nothing more.
IO.puts("shared=#{Guide.pick(%{share: :state, restart: false})}") # => plain state takes an agent.
# => State that must survive crashes needs a supervised GenServer instead.
IO.puts("durable=#{Guide.pick(%{share: :state, restart: true})} named=#{Guide.pick(%{share: :named})}") # => durable and named answers.
