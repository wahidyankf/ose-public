# => Example 55: GenServer Holds Live State
Logger.configure(level: :warning)
# => warnings only; GenServers stay silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one GenServer module holds one shopper's basket
defmodule Ex55.Basket do
  # => GenServer callbacks live here
  use GenServer

  # => clients start one basket per shopper
  def start_link(_opts), do: GenServer.start_link(__MODULE__, [])

  # => the basket starts empty after every boot
  def init(first), do: {:ok, first}

  # => add conses one item onto the basket
  def handle_call({:add, item}, _from, items), do: {:reply, :ok, [item | items]}

  # => list reads the items in arrival order
  def handle_call(:list, _from, items), do: {:reply, Enum.reverse(items), items}
end

# => run/0 holds the whole example narrative
defmodule Ex55.Main do
  # => single entry point the last line calls
  def run do
    # => one supervision tree owns the basket
    {:ok, sup} = Supervisor.start_link([{Ex55.Basket, []}], strategy: :one_for_one)
    # => the single child answers under a known id
    [{_, basket, _, _}] = Supervisor.which_children(sup)
    # => two items land in arrival order
    GenServer.call(basket, {:add, "noodles"})
    # => the second add joins the first
    GenServer.call(basket, {:add, "tea"})
    # => Output: basket: noodles tea
    IO.puts("basket: #{GenServer.call(basket, :list) |> Enum.join(" ")}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex55.Main.run()
