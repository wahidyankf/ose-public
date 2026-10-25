# => Example 19: Render Turns Assigns Into Html
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module greets by assign
defmodule Ex19.Greeter do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount seeds the name every render reads
  def mount(_params, _session, socket) do
    # => the greeting names ada from the start
    {:ok, assign(socket, name: "ada")}
    # => end mount: one assign, one template
  end

  # => the template reads the name assign
  def render(assigns), do: ~H"<p>hi {@name}</p>"
  # => end view: assigns in, HTML out
end

# => run/0 holds the whole example narrative
defmodule Ex19.Main do
  # => single entry point the last line calls
  def run do
    # => mount first, so assigns exist
    {:ok, socket} = Ex19.Greeter.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => render produces the template struct
    html =
      Ex19.Greeter.render(socket.assigns)
      |> Phoenix.HTML.Safe.to_iodata()
      |> IO.iodata_to_binary()

    # => Output: html: <p>hi ada</p>
    IO.puts("html: #{html}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex19.Main.run()
