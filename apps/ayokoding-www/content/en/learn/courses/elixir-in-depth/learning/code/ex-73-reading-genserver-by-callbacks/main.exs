# => Example 73: read a GenServer callback by callback, state type first.
defmodule Stack do # => the push-pop stack server.
  # => use wires the behaviour; init declares the state is a list.
  use GenServer # => wire the OTP behaviour into this module.
  def start_link(items), do: GenServer.start_link(__MODULE__, items) # => start unregistered with items.
  @impl GenServer # => tie init to its callback.
  def init(items), do: {:ok, items} # => the state starts as the items list.
  # => handle_call pops the head; the empty clause is the boundary case.
  @impl GenServer # => tie the pop clause to its callback.
  def handle_call(:pop, _from, [h | t]), do: {:reply, {:ok, h}, t} # => reply the head, keep the tail.
  def handle_call(:pop, _from, []), do: {:reply, {:error, :empty}, []} # => the empty-boundary clause.
  # => handle_cast pushes without replying; state grows silently.
  @impl GenServer # => tie the push clause to its callback.
  def handle_cast({:push, x}, items), do: {:noreply, [x | items]} # => prepend, reply nothing.
end # => the server module closes.
# => The reading order: init state type, then each callback's state change.
{:ok, stack} = Stack.start_link([1, 2]) # => the stack starting as [1, 2].
# => The cast lands first; calls observe the state the cast built.
GenServer.cast(stack, {:push, 0}) # => push zero; the reply comes later.
# => Calls observe send order here because each call waits for its reply.
first = GenServer.call(stack, :pop) # => first pop takes the pushed zero.
second = GenServer.call(stack, :pop) # => second pop takes the one.
# => Print the two pops: cast-then-calls compose into one story.
IO.puts("first=#{inspect(first)} second=#{inspect(second)}") # => the cast-then-calls proof.
