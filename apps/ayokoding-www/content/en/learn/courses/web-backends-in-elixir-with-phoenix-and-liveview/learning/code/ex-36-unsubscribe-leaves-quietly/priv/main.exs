# => Example 36: Unsubscribe Leaves Quietly
Logger.configure(level: :warning)
# => warnings only; PubSub stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => run/0 holds the whole example narrative
defmodule Ex36.Main do
  # => single entry point the last line calls
  def run do
    # => one supervision tree owns the local bus
    {:ok, _} = Supervisor.start_link([{Phoenix.PubSub, name: Ex36.Bus}], strategy: :one_for_one)
    # => this process listens on the orders topic
    Phoenix.PubSub.subscribe(Ex36.Bus, "orders")
    # => leaving drops the subscription at once
    Phoenix.PubSub.unsubscribe(Ex36.Bus, "orders")
    # => the broadcast finds no subscriber here
    Phoenix.PubSub.broadcast(Ex36.Bus, "orders", {:created, 101})
    # => the mailbox stays empty after leaving
    receive do
      # => any arrival here would surprise the lesson
      {:created, _} ->
        IO.puts("got: unexpected")
        # => end receive: silence is the assertion
    after
      # => Output: quiet: true
      100 ->
        IO.puts("quiet: true")
        # => end after: leaving means silence
    end

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex36.Main.run()
