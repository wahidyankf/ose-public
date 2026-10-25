# => Example 52: Topics Keep Separate Rosters
Logger.configure(level: :warning)
# => warnings only; Presence stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one presence module names the tracker
defmodule Ex52.Tracker do
  # => the bus name wires tracker to PubSub
  use Phoenix.Presence, otp_app: :app, pubsub_server: Ex52.Bus
end

# => run/0 holds the whole example narrative
defmodule Ex52.Main do
  # => single entry point the last line calls
  def run do
    # => one tree owns the bus and the tracker
    {:ok, _} =
      Supervisor.start_link([{Phoenix.PubSub, name: Ex52.Bus}, Ex52.Tracker],
        strategy: :one_for_one
      )

    # => ada joins the noodles room
    {:ok, _} = Ex52.Tracker.track(self(), "room:noodles", "ada", %{})
    # => budi joins the tea room instead
    {:ok, _} = Ex52.Tracker.track(self(), "room:tea", "budi", %{})
    # => Output: noodles: 1 tea: 1
    IO.puts(
      "noodles: #{Ex52.Tracker.list("room:noodles") |> map_size()} tea: #{Ex52.Tracker.list("room:tea") |> map_size()}"
    )

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex52.Main.run()
