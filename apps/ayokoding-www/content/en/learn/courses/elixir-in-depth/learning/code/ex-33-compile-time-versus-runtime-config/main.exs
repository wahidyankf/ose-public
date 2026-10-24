# => Example 33: module attributes freeze at compile time; runtime reads calls.
defmodule Greeting do # => the two-timing greeting module.
  # => compile_env inlines the default into the beam; recompile to change it.
  @prefix Application.compile_env(:ex33, :prefix, "hello") # => the frozen default.
  # => The attribute accessor exposes the frozen value for comparison.
  def prefix, do: @prefix # => read the compiled-in value.
  # => fetch_env! reads at call time, so releases can change it per boot.
  def greet(name), do: "#{Application.fetch_env!(:ex33, :prefix)} #{name}" # => read the live value.
end # => the module closes; compiled and runtime reads coexist.
# => put_env sets the runtime value the greeting reads on every call.
Application.put_env(:ex33, :prefix, "howdy") # => move the runtime value.
# => The compiled default stayed hello while the runtime value moved.
IO.puts("compiled=#{Greeting.prefix()} runtime=#{Greeting.greet("ada")}") # => frozen versus live, side by side.
