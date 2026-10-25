# => Example 29: Event Replies With an Ack
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module saves one draft note
defmodule Ex29.Draft do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount starts with nothing saved yet
  def mount(_params, _session, socket) do
    # => saved flips to true on the first save
    {:ok, assign(socket, saved: false)}
    # => end mount: unsaved until the event
  end

  # => the save event answers the caller directly
  def handle_event("save", %{"note" => note}, socket) do
    # => the reply carries the saved note back
    {:reply, %{saved: note}, assign(socket, saved: true)}
    # => end event: state flips, caller learns it
  end

  # => the template reads the saved flag
  def render(assigns), do: ~H"<p>saved: {@saved}</p>"
  # => end view: flag in, line out
end

# => run/0 holds the whole example narrative
defmodule Ex29.Main do
  # => single entry point the last line calls
  def run do
    # => mount first, so the saved assign exists
    {:ok, socket} = Ex29.Draft.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => the client saves one short note
    {:reply, ack, next} = Ex29.Draft.handle_event("save", %{"note" => "buy tea"}, socket)
    # => Output: ack: buy tea saved: true
    IO.puts("ack: #{ack.saved} saved: #{next.assigns.saved}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex29.Main.run()
