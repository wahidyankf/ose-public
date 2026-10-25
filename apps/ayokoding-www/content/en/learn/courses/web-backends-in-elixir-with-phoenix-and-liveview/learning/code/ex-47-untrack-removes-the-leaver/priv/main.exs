# => Example 47: Untrack Removes the Leaver
Logger.configure(level: :warning)
# => warnings only; Presence stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one presence module names the tracker
defmodule Ex47.Tracker do
  # => the bus name wires tracker to PubSub
  use Phoenix.Presence, otp_app: :app, pubsub_server: Ex47.Bus
end

# => run/0 holds the whole example narrative
defmodule Ex47.Main do
  # => single entry point the last line calls
  def run do
    # => one tree owns the bus and the tracker
    {:ok, _} =
      Supervisor.start_link([{Phoenix.PubSub, name: Ex47.Bus}, Ex47.Tracker],
        strategy: :one_for_one
      )

    # => ada arrives in room 7 first
    {:ok, _} = Ex47.Tracker.track(self(), "room:7", "ada", %{device: "web"})
    # => ada leaves the room again
    :ok = Ex47.Tracker.untrack(self(), "room:7", "ada")
    # => Output: left: 0
    IO.puts("left: #{Ex47.Tracker.list("room:7") |> map_size()}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex47.Main.run()
