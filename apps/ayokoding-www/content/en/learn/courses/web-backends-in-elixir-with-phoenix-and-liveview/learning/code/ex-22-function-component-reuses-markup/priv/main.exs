# => Example 22: Function Component Reuses Markup
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one component module owns the greeting markup
defmodule Ex22.Cards do
  # => attr and slot macros live here
  use Phoenix.Component

  # => the greeting needs exactly one name
  attr(:name, :string, required: true)

  # => one function, one reusable paragraph
  def greet(assigns), do: ~H"<p>hi {@name}</p>"
  # => end component: markup with a contract
end

# => one LiveView module places the component
defmodule Ex22.Page do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount seeds the name the component reads
  def mount(_params, _session, socket) do
    # => the page owns the data, the card owns markup
    {:ok, assign(socket, name: "ada")}
    # => end mount: data stays in the view
  end

  # => the template delegates one line to the card
  def render(assigns), do: ~H"<Ex22.Cards.greet name={@name} />"
  # => end view: composition over duplication
end

# => run/0 holds the whole example narrative
defmodule Ex22.Main do
  # => single entry point the last line calls
  def run do
    # => mount first, so the name assign exists
    {:ok, socket} = Ex22.Page.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => render expands the component inline
    html =
      Ex22.Page.render(socket.assigns) |> Phoenix.HTML.Safe.to_iodata() |> IO.iodata_to_binary()

    # => Output: html: <p>hi ada</p>
    IO.puts("html: #{html}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex22.Main.run()
