# => Example 40: Broadcast From Skips the Sender
Logger.configure(level: :warning)
# => warnings only; PubSub stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => run/0 holds the whole example narrative
defmodule Ex40.Main do
  # => single entry point the last line calls
  def run do
    # => one supervision tree owns the local bus
    {:ok, _} = Supervisor.start_link([{Phoenix.PubSub, name: Ex40.Bus}], strategy: :one_for_one)
    # => this process listens on the room topic
    Phoenix.PubSub.subscribe(Ex40.Bus, "room:7")
    # => broadcast_from skips the sender's own mailbox
    Phoenix.PubSub.broadcast_from(Ex40.Bus, self(), "room:7", {:shout, "hi"})
    # => the sender hears nothing from itself
    receive do
      # => any arrival here would surprise the lesson
      {:shout, _} ->
        IO.puts("heard: self")
        # => end receive: the sender stays deaf
    after
      # => Output: self skipped: true
      100 ->
        IO.puts("self skipped: true")
        # => end after: from-skips-self holds
    end

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex40.Main.run()
