# => Example 58: GenServers serialize calls; casts stay fire-and-forget.
defmodule Counter do # => the serializing counter server.
  # => use wires the behaviour; init sets the starting state.
  use GenServer # => wire the OTP behaviour into this module.
  def start_link(n), do: GenServer.start_link(__MODULE__, n) # => start unregistered with n.
  # => init runs once in the server process before any message arrives.
  @impl GenServer # => tie init to its callback.
  def init(n), do: {:ok, n} # => the state starts as the argument.
  # => handle_call answers synchronously; reply and state return together.
  @impl GenServer # => tie the bump clause to its callback.
  def handle_call(:bump, _from, n), do: {:reply, n + 1, n + 1} # => reply and install n+1.
  # => handle_cast updates without replying; callers never block on it.
  @impl GenServer # => tie the reset clause to its callback.
  def handle_cast(:reset, _n), do: {:noreply, 0} # => install zero, reply nothing.
end # => the server module closes.
# => start_link ties the server to the script; it exits when the script ends.
{:ok, server} = Counter.start_link(10) # => the server starting at ten.
# => call blocks for the reply; two bumps serialize in send order.
first = GenServer.call(server, :bump) # => first bump replies eleven.
second = GenServer.call(server, :bump) # => second bump replies twelve.
# => cast resets without a reply; the next call observes the reset value.
GenServer.cast(server, :reset) # => fire the reset, block on nothing.
after_reset = GenServer.call(server, :bump) # => the post-reset call replies one.
# => Print the serialized replies and the post-reset proof.
IO.puts("first=#{first} second=#{second} after_reset=#{after_reset}") # => the serialization proof.
