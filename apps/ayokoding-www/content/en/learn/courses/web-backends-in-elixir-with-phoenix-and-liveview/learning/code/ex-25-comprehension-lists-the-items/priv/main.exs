# => Example 25: Comprehension Lists the Items
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module lists two fixed orders
defmodule Ex25.Orders do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount seeds the two rows the list reads
  def mount(_params, _session, socket) do
    # => fixed rows keep the transcript stable
    {:ok, assign(socket, items: ["noodles", "tea"])}
    # => end mount: the list owns the rows
  end

  # => one list item per row, nothing else
  def render(assigns), do: ~H"<ul><li :for={item <- @items}>{item}</li></ul>"
  # => end view: rows in, list out
end

# => run/0 holds the whole example narrative
defmodule Ex25.Main do
  # => single entry point the last line calls
  def run do
    # => mount first, so the rows assign exists
    {:ok, socket} = Ex25.Orders.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => render expands one item per row
    html =
      Ex25.Orders.render(socket.assigns) |> Phoenix.HTML.Safe.to_iodata() |> IO.iodata_to_binary()

    # => Output: html: <ul><li>noodles</li><li>tea</li></ul>
    IO.puts("html: #{html}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex25.Main.run()
