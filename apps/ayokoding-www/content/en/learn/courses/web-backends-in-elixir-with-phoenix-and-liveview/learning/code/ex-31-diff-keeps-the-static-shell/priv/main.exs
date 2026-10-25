# => Example 31: Diff Keeps the Static Shell
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module counts inside a fixed shell
defmodule Ex31.Counter do
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

  # => the header never changes, the count does
  def render(assigns), do: ~H"<header>shop</header><p>count: {@count}</p>"
  # => end view: static shell, dynamic line
end

# => run/0 holds the whole example narrative
defmodule Ex31.Main do
  # => single entry point the last line calls
  def run do
    # => mount first, so the count assign exists
    {:ok, socket} = Ex31.Counter.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => render the page before any press
    before =
      Ex31.Counter.render(socket.assigns)
      |> Phoenix.HTML.Safe.to_iodata()
      |> IO.iodata_to_binary()

    # => one press changes exactly one assign
    {:noreply, next} = Ex31.Counter.handle_event("inc", %{}, socket)
    # => render the page after the press
    after_press =
      Ex31.Counter.render(next.assigns) |> Phoenix.HTML.Safe.to_iodata() |> IO.iodata_to_binary()

    # => Output: before: <header>shop</header><p>count: 0</p>
    IO.puts("before: #{before}")
    # => Output: after: <header>shop</header><p>count: 1</p>
    IO.puts("after: #{after_press}")
    # => the shell survives in both renders
    kept =
      String.contains?(before, "<header>shop</header>") and
        String.contains?(after_press, "<header>shop</header>")

    # => Output: static kept: true
    IO.puts("static kept: #{kept}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex31.Main.run()
