# => Example 46: Presence Lists Many Users
Logger.configure(level: :warning)
# => warnings only; Presence stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one presence module names the tracker
defmodule Ex46.Tracker do
  # => the bus name wires tracker to PubSub
  use Phoenix.Presence, otp_app: :app, pubsub_server: Ex46.Bus
end

# => run/0 holds the whole example narrative
defmodule Ex46.Main do
  # => single entry point the last line calls
  def run do
    # => one tree owns the bus and the tracker
    {:ok, _} =
      Supervisor.start_link([{Phoenix.PubSub, name: Ex46.Bus}, Ex46.Tracker],
        strategy: :one_for_one
      )

    # => three friends arrive in the same room
    {:ok, _} = Ex46.Tracker.track(self(), "room:7", "ada", %{device: "web"})
    # => the second arrival shares the tracker
    {:ok, _} = Ex46.Tracker.track(self(), "room:7", "budi", %{device: "mobile"})
    # => the third arrival completes the room
    {:ok, _} = Ex46.Tracker.track(self(), "room:7", "citra", %{device: "web"})
    # => the room roster sorts itself for the transcript
    names = Ex46.Tracker.list("room:7") |> Map.keys() |> Enum.sort() |> Enum.join(" ")
    # => Output: room: ada budi citra
    IO.puts("room: #{names}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex46.Main.run()
