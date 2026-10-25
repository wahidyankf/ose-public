# => Kata 1 solution: counter with its event
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module counts button presses
defmodule Kata01s.Counter do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount starts every visitor at zero
  def mount(_params, _session, socket) do
    # => one assign holds the whole state
    {:ok, assign(socket, count: 0)}
    # => end mount: zero until the first press
  end

  # => the inc event adds exactly one
  def handle_event("inc", _params, socket) do
    # => update transforms the old count
    {:noreply, update(socket, :count, &(&1 + 1))}
    # => end event: state change, no reply
  end

  # => the template reads the count assign
  def render(assigns), do: ~H"<p>count: {@count}</p>"
  # => end view: press in, number out
end

# => run/0 presses the new handler twice
defmodule Kata01s.Main do
  # => single entry point the last line calls
  def run do
    # => mount first, so the count assign exists
    {:ok, socket} = Kata01s.Counter.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => the client presses inc twice in a row
    {:noreply, one} = Kata01s.Counter.handle_event("inc", %{}, socket)
    # => the second press sees the first press's state
    {:noreply, two} = Kata01s.Counter.handle_event("inc", %{}, one)
    # => Output: count: 2
    IO.puts("count: #{two.assigns.count}")

    # => end run: the handler unblocked the counter
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata01s.Main.run()
