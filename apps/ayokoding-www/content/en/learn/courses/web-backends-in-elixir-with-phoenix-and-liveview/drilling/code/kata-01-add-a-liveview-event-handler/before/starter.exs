# => Kata 1 starter: counter without its event
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module counts nothing yet
defmodule Kata01.Counter do
  # => mount and render callbacks live here
  use Phoenix.LiveView

  # => mount starts every visitor at zero
  def mount(_params, _session, socket) do
    # => one assign holds the whole state
    {:ok, assign(socket, count: 0)}
    # => end mount: zero forever without an event
  end

  # => MISSING: handle_event("inc", ...) goes here
  # => without it every press crashes the process

  # => the template reads the count assign
  def render(assigns), do: ~H"<p>count: {@count}</p>"
  # => end view: mount first, render after
end

# => run/0 shows the stuck counter
defmodule Kata01.Main do
  # => single entry point the last line calls
  def run do
    # => mount first, so the count assign exists
    {:ok, socket} = Kata01.Counter.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => Output: stuck: 0
    IO.puts("stuck: #{socket.assigns.count}")

    # => end run: add the handler, then press
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata01.Main.run()
