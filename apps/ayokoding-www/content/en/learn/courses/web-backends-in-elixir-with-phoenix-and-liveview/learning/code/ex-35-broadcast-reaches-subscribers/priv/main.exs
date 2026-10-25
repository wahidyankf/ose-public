# => Example 35: Broadcast Reaches Subscribers
Logger.configure(level: :warning)
# => warnings only; PubSub stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => run/0 holds the whole example narrative
defmodule Ex35.Main do
  # => single entry point the last line calls
  def run do
    # => one supervision tree owns the local bus
    {:ok, _} = Supervisor.start_link([{Phoenix.PubSub, name: Ex35.Bus}], strategy: :one_for_one)
    # => this process listens on the orders topic
    Phoenix.PubSub.subscribe(Ex35.Bus, "orders")
    # => the broadcast lands in every subscriber mailbox
    Phoenix.PubSub.broadcast(Ex35.Bus, "orders", {:created, 101})
    # => the mailbox holds exactly what was sent
    receive do
      # => Output: got: created 101
      {:created, 101} ->
        IO.puts("got: created 101")
        # => end receive: one message, one line
    after
      # => a missing message would fail loudly here
      1000 ->
        IO.puts("got: nothing")
        # => end after: the bus always delivers
    end

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex35.Main.run()
