# => Example 48: Metas Carry Device Facts
Logger.configure(level: :warning)
# => warnings only; Presence stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one presence module names the tracker
defmodule Ex48.Tracker do
  # => the bus name wires tracker to PubSub
  use Phoenix.Presence, otp_app: :app, pubsub_server: Ex48.Bus
end

# => run/0 holds the whole example narrative
defmodule Ex48.Main do
  # => single entry point the last line calls
  def run do
    # => one tree owns the bus and the tracker
    {:ok, _} =
      Supervisor.start_link([{Phoenix.PubSub, name: Ex48.Bus}, Ex48.Tracker],
        strategy: :one_for_one
      )

    # => ada arrives carrying her device fact
    {:ok, _} = Ex48.Tracker.track(self(), "room:7", "ada", %{device: "mobile"})
    # => get_by_key returns the entry with its metas
    entry = Ex48.Tracker.get_by_key("room:7", "ada")
    # => the first meta carries the tracked device
    device = entry.metas |> hd() |> Map.get(:device)
    # => Output: device: mobile
    IO.puts("device: #{device}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex48.Main.run()
