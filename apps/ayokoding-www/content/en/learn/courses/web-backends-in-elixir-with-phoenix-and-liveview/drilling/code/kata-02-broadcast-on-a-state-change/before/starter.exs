# => Kata 2 starter: state changes nobody hears
Logger.configure(level: :warning)
# => warnings only; PubSub stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => run/0 changes state without telling the bus
defmodule Kata02.Main do
  # => single entry point the last line calls
  def run do
    # => one supervision tree owns the local bus
    {:ok, _} = Supervisor.start_link([{Phoenix.PubSub, name: Kata02.Bus}], strategy: :one_for_one)
    # => this process listens on the orders topic
    Phoenix.PubSub.subscribe(Kata02.Bus, "orders")
    # => MISSING: broadcast {:count, 1} after the change
    # => the mailbox stays empty without it
    receive do
      # => any arrival here would surprise the lesson
      {:count, _} ->
        IO.puts("heard: some count")
        # => end receive: silence is the bug
    after
      # => Output: heard: nothing
      100 ->
        IO.puts("heard: nothing")
        # => end after: unheard changes fix nothing
    end

    # => end run: broadcast on change, then listen
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata02.Main.run()
