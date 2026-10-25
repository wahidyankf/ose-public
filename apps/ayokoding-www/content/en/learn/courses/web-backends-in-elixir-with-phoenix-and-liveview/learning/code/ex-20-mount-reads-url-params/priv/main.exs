# => Example 20: Mount Reads Url Params
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module greets the routed name
defmodule Ex20.Greeter do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => params carry the router's segments
  def mount(%{"name" => name}, _session, socket) do
    # => the URL segment becomes the greeting name
    {:ok, assign(socket, name: name)}
    # => end mount: params shape the first state
  end

  # => the template reads the name assign
  def render(assigns), do: ~H"<p>hi {@name}</p>"
  # => end view: one param, one greeting
end

# => run/0 holds the whole example narrative
defmodule Ex20.Main do
  # => single entry point the last line calls
  def run do
    # => mount with the router's name segment
    {:ok, socket} = Ex20.Greeter.mount(%{"name" => "budi"}, %{}, struct(Phoenix.LiveView.Socket))
    # => the segment survived into assigns
    html =
      Ex20.Greeter.render(socket.assigns)
      |> Phoenix.HTML.Safe.to_iodata()
      |> IO.iodata_to_binary()

    # => Output: html: <p>hi budi</p>
    IO.puts("html: #{html}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex20.Main.run()
