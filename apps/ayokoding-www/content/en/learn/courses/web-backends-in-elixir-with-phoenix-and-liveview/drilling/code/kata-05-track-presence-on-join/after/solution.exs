# => Kata 5 solution: join tracks the arrival
Logger.configure(level: :warning)
# => warnings only; Presence stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one presence module names the tracker
defmodule Kata05s.Tracker do
  # => the bus name wires tracker to PubSub
  use Phoenix.Presence, otp_app: :app, pubsub_server: Kata05s.Bus
end

# => run/0 tracks the join, then lists the roster
defmodule Kata05s.Main do
  # => single entry point the last line calls
  def run do
    # => one tree owns the bus and the tracker
    {:ok, _} =
      Supervisor.start_link([{Phoenix.PubSub, name: Kata05s.Bus}, Kata05s.Tracker],
        strategy: :one_for_one
      )

    # => ada arrives in room 7 from the web client
    {:ok, _} = Kata05s.Tracker.track(self(), "room:7", "ada", %{device: "web"})
    # => Output: roster: 1
    IO.puts("roster: #{Kata05s.Tracker.list("room:7") |> map_size()}")

    # => end run: every join leaves a trace
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata05s.Main.run()
