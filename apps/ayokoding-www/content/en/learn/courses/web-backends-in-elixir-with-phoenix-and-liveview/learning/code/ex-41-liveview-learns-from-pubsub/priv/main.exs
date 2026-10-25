# => Example 41: LiveView Learns From PubSub
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module shows the newest order
defmodule Ex41.Board do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount starts with no order on the board
  def mount(_params, _session, socket) do
    # => latest stays nil until the first broadcast
    {:ok, assign(socket, latest: nil)}
    # => end mount: empty board, open ears
  end

  # => order broadcasts update the board state
  def handle_info({:order_created, id}, socket) do
    # => the newest id replaces the old one
    {:noreply, assign(socket, latest: id)}
    # => end info: message in, state out
  end

  # => the template reads the latest assign
  def render(assigns), do: ~H"<p>latest: {@latest}</p>"
  # => end view: broadcast in, line out
end

# => run/0 holds the whole example narrative
defmodule Ex41.Main do
  # => single entry point the last line calls
  def run do
    # => one supervision tree owns the local bus
    {:ok, _} = Supervisor.start_link([{Phoenix.PubSub, name: Ex41.Bus}], strategy: :one_for_one)
    # => this process listens for new orders
    Phoenix.PubSub.subscribe(Ex41.Bus, "orders")
    # => a new order appears elsewhere in the system
    Phoenix.PubSub.broadcast(Ex41.Bus, "orders", {:order_created, 101})
    # => the broadcast waits in the mailbox
    receive do
      # => the LiveView callback consumes it
      {:order_created, _} = msg ->
        # => mount first, so the latest assign exists
        {:ok, socket} = Ex41.Board.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
        # => handle_info folds the message into state
        {:noreply, next} = Ex41.Board.handle_info(msg, socket)
        # => Output: latest: 101
        IO.puts("latest: #{next.assigns.latest}")
        # => end branch: message handled, board updated
    after
      # => a missing message would fail loudly here
      1000 ->
        IO.puts("latest: missing")
        # => end after: the bus always delivers
    end

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex41.Main.run()
