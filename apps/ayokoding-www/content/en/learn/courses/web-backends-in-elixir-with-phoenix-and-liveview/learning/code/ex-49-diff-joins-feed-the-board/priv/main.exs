# => Example 49: Diff Joins Feed the Board
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module counts the online friends
defmodule Ex49.Board do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount starts with nobody online yet
  def mount(_params, _session, socket) do
    # => online counts the friends on the board
    {:ok, assign(socket, online: [])}
    # => end mount: empty board, open ears
  end

  # => join diffs append the arrived names
  def handle_info(%{event: "presence_diff", joins: joins}, socket) do
    # => the join keys name the arrived friends
    {:noreply, assign(socket, online: Map.keys(joins))}
    # => end info: diff in, roster out
  end

  # => the template counts the online names
  def render(assigns), do: ~H"<p>online: {length(@online)}</p>"
  # => end view: roster in, count out
end

# => run/0 holds the whole example narrative
defmodule Ex49.Main do
  # => single entry point the last line calls
  def run do
    # => mount first, so the online assign exists
    {:ok, socket} = Ex49.Board.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => two friends arrive in one diff message
    diff = %{event: "presence_diff", joins: %{"ada" => %{}, "budi" => %{}}}
    # => handle_info folds the diff into state
    {:noreply, next} = Ex49.Board.handle_info(diff, socket)
    # => Output: online: 2
    IO.puts("online: #{length(next.assigns.online)}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex49.Main.run()
