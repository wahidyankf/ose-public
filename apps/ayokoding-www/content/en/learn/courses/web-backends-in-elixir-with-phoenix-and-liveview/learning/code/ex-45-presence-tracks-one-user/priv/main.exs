# => Example 45: Presence Tracks One User
Logger.configure(level: :warning)
# => warnings only; Presence stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one presence module names the tracker
defmodule Ex45.Tracker do
  # => the bus name wires tracker to PubSub
  use Phoenix.Presence, otp_app: :app, pubsub_server: Ex45.Bus
end

# => run/0 holds the whole example narrative
defmodule Ex45.Main do
  # => single entry point the last line calls
  def run do
    # => one tree owns the bus and the tracker
    {:ok, _} =
      Supervisor.start_link([{Phoenix.PubSub, name: Ex45.Bus}, Ex45.Tracker],
        strategy: :one_for_one
      )

    # => ada arrives in room 7 from the web client
    {:ok, _} = Ex45.Tracker.track(self(), "room:7", "ada", %{device: "web"})
    # => Output: tracked: 1
    IO.puts("tracked: #{Ex45.Tracker.list("room:7") |> map_size()}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex45.Main.run()
