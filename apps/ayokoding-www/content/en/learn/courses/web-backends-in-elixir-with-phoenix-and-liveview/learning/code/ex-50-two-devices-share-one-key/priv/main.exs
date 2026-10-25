# => Example 50: Two Devices Share One Key
Logger.configure(level: :warning)
# => warnings only; Presence stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one presence module names the tracker
defmodule Ex50.Tracker do
  # => the bus name wires tracker to PubSub
  use Phoenix.Presence, otp_app: :app, pubsub_server: Ex50.Bus
end

# => run/0 holds the whole example narrative
defmodule Ex50.Main do
  # => single entry point the last line calls
  def run do
    # => one tree owns the bus and the tracker
    {:ok, _} =
      Supervisor.start_link([{Phoenix.PubSub, name: Ex50.Bus}, Ex50.Tracker],
        strategy: :one_for_one
      )

    # => a keeper holds one tracking alive
    keeper =
      spawn(fn ->
        receive do
          :stop -> :ok
        end
      end)

    # => ada arrives from the web client process
    {:ok, _} = Ex50.Tracker.track(self(), "room:7", "ada", %{device: "web"})
    # => ada arrives again from the keeper process
    {:ok, _} = Ex50.Tracker.track(keeper, "room:7", "ada", %{device: "mobile"})
    # => one key now carries two device metas
    entry = Ex50.Tracker.get_by_key("room:7", "ada")
    # => the devices sort themselves for the transcript
    devices = entry.metas |> Enum.map(&Map.get(&1, :device)) |> Enum.sort() |> Enum.join(" ")
    # => Output: devices: mobile web
    IO.puts("devices: #{devices}")
    # => the keeper process may exit now
    send(keeper, :stop)

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex50.Main.run()
