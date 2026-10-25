# => Kata 2 solution: state changes broadcast aloud
Logger.configure(level: :warning)
# => warnings only; PubSub stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => run/0 broadcasts the new count after changing it
defmodule Kata02s.Main do
  # => single entry point the last line calls
  def run do
    # => one supervision tree owns the local bus
    {:ok, _} =
      Supervisor.start_link([{Phoenix.PubSub, name: Kata02s.Bus}], strategy: :one_for_one)

    # => this process listens on the orders topic
    Phoenix.PubSub.subscribe(Kata02s.Bus, "orders")
    # => the state change and its broadcast travel together
    Phoenix.PubSub.broadcast(Kata02s.Bus, "orders", {:count, 1})
    # => the mailbox holds the announced change
    receive do
      # => Output: heard: 1
      {:count, n} ->
        IO.puts("heard: #{n}")
        # => end receive: announced changes arrive
    after
      # => a missing message would fail loudly here
      1000 ->
        IO.puts("heard: nothing")
        # => end after: the bus always delivers
    end

    # => end run: every change tells the bus
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata02s.Main.run()
