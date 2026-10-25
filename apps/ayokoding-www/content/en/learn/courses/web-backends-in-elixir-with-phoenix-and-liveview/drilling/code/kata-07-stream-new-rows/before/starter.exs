# => Kata 7 starter: rows re-render as one list
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module lists rows from assigns
defmodule Kata07.Orders do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount starts the rows as a plain list
  def mount(_params, _session, socket) do
    # => MISSING: stream(socket, :orders, ...) goes here
    {:ok, assign(socket, rows: ["noodles", "tea"])}
    # => end mount: every insert re-renders all
  end

  # => the template reads the plain list
  def render(assigns), do: ~H"<ul><li :for={row <- @rows}>{row}</li></ul>"
  # => end view: list in, list out
end

# => run/0 shows the plain-list render
defmodule Kata07.Main do
  # => single entry point the last line calls
  def run do
    # => mount first, so the rows assign exists
    {:ok, socket} = Kata07.Orders.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => render expands both rows at once
    html =
      Kata07.Orders.render(socket.assigns)
      |> Phoenix.HTML.Safe.to_iodata()
      |> IO.iodata_to_binary()

    # => Output: rows: <ul><li>noodles</li><li>tea</li></ul>
    IO.puts("rows: #{html}")

    # => end run: stream the rows, then insert
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata07.Main.run()
