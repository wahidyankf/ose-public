# => Example 33: Flash Carries One Notice
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module confirms one saved order
defmodule Ex33.Saver do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount starts with nothing saved yet
  def mount(_params, _session, socket) do
    # => saved flips to true on the first save
    {:ok, assign(socket, saved: false)}
    # => end mount: unsaved until the event
  end

  # => the save event stores a notice in flash
  def handle_event("save", _params, socket) do
    # => put_flash writes the notice for the next render
    {:noreply, socket |> put_flash(:info, "order saved") |> assign(saved: true)}
    # => end event: notice set, flag flipped
  end

  # => the template reads the saved flag
  def render(assigns), do: ~H"<p>saved: {@saved}</p>"
  # => end view: flag in, line out
end

# => run/0 holds the whole example narrative
defmodule Ex33.Main do
  # => single entry point the last line calls
  def run do
    # => the transport seeds an empty flash map
    seeded = Map.update!(struct(Phoenix.LiveView.Socket), :assigns, &Map.put(&1, :flash, %{}))
    # => mount first, so the saved assign exists
    {:ok, socket} = Ex33.Saver.mount(%{}, %{}, seeded)
    # => the client saves the order once
    {:noreply, next} = Ex33.Saver.handle_event("save", %{}, socket)
    # => Output: notice: order saved saved: true
    IO.puts("notice: #{next.assigns.flash["info"]} saved: #{next.assigns.saved}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex33.Main.run()
