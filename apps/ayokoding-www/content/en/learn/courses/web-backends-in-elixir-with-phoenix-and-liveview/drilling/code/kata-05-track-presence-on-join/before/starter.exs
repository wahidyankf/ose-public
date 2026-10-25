# => Kata 5 starter: join nobody tracks
Logger.configure(level: :warning)
# => warnings only; Presence stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one presence module names the tracker
defmodule Kata05.Tracker do
  # => the bus name wires tracker to PubSub
  use Phoenix.Presence, otp_app: :app, pubsub_server: Kata05.Bus
end

# => run/0 joins without tracking the arrival
defmodule Kata05.Main do
  # => single entry point the last line calls
  def run do
    # => one tree owns the bus and the tracker
    {:ok, _} =
      Supervisor.start_link([{Phoenix.PubSub, name: Kata05.Bus}, Kata05.Tracker],
        strategy: :one_for_one
      )

    # => MISSING: track(self(), "room:7", "ada", ...) here
    # => the roster stays empty without it
    IO.puts("roster: #{Kata05.Tracker.list("room:7") |> map_size()}")

    # => end run: track the join, then list
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata05.Main.run()
