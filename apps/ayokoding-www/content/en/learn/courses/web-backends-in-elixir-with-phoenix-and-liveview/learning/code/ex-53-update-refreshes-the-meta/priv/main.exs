# => Example 53: Update Refreshes the Meta
Logger.configure(level: :warning)
# => warnings only; Presence stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one presence module names the tracker
defmodule Ex53.Tracker do
  # => the bus name wires tracker to PubSub
  use Phoenix.Presence, otp_app: :app, pubsub_server: Ex53.Bus
end

# => run/0 holds the whole example narrative
defmodule Ex53.Main do
  # => single entry point the last line calls
  def run do
    # => one tree owns the bus and the tracker
    {:ok, _} =
      Supervisor.start_link([{Phoenix.PubSub, name: Ex53.Bus}, Ex53.Tracker],
        strategy: :one_for_one
      )

    # => ada arrives on the web client first
    {:ok, _} = Ex53.Tracker.track(self(), "room:7", "ada", %{device: "web"})
    # => ada switches to the mobile client after
    {:ok, _} = Ex53.Tracker.update(self(), "room:7", "ada", %{device: "mobile"})
    # => the entry still names one key
    entry = Ex53.Tracker.get_by_key("room:7", "ada")
    # => the refreshed meta names the new device
    device = entry.metas |> hd() |> Map.get(:device)
    # => Output: now: mobile
    IO.puts("now: #{device}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex53.Main.run()
