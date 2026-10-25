# => Example 51: LiveView Counts Online Friends
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one presence module names the tracker
defmodule Ex51.Tracker do
  # => the bus name wires tracker to PubSub
  use Phoenix.Presence, otp_app: :app, pubsub_server: Ex51.Bus
end

# => one LiveView module shows the room count
defmodule Ex51.Room do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount reads the current roster once
  def mount(_params, _session, socket) do
    # => the count starts from whoever is already here
    {:ok, assign(socket, count: map_size(Ex51.Tracker.list("room:7")))}
    # => end mount: count what exists, watch the rest
  end

  # => join diffs grow the count by the arrivals
  def handle_info(%{event: "presence_diff", joins: joins}, socket) do
    # => each arrival adds exactly one
    {:noreply, update(socket, :count, &(&1 + map_size(joins)))}
    # => end info: arrivals in, count out
  end

  # => the template reads the count assign
  def render(assigns), do: ~H"<p>here: {@count}</p>"
  # => end view: count in, line out
end

# => run/0 holds the whole example narrative
defmodule Ex51.Main do
  # => single entry point the last line calls
  def run do
    # => one tree owns the bus and the tracker
    {:ok, _} =
      Supervisor.start_link([{Phoenix.PubSub, name: Ex51.Bus}, Ex51.Tracker],
        strategy: :one_for_one
      )

    # => ada is already in the room at mount time
    {:ok, _} = Ex51.Tracker.track(self(), "room:7", "ada", %{device: "web"})
    # => mount counts the one present friend
    {:ok, socket} = Ex51.Room.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => budi arrives in a diff right after mount
    {:noreply, next} =
      Ex51.Room.handle_info(%{event: "presence_diff", joins: %{"budi" => %{}}}, socket)

    # => Output: here: 2
    IO.puts("here: #{next.assigns.count}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex51.Main.run()
