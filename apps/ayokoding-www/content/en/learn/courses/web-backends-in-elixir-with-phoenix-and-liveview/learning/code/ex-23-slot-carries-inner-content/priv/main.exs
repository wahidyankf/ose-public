# => Example 23: Slot Carries Inner Content
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one component module owns the section shell
defmodule Ex23.Cards do
  # => attr and slot macros live here
  use Phoenix.Component

  # => callers fill exactly one inner block
  slot(:inner_block, required: true)

  # => the shell wraps whatever the caller passes
  def card(assigns), do: ~H"<section>{render_slot(@inner_block)}</section>"
  # => end component: shell outside, content inside
end

# => one LiveView module fills the slot
defmodule Ex23.Page do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount seeds the order count the slot reads
  def mount(_params, _session, socket) do
    # => two open orders wait inside the card
    {:ok, assign(socket, open: 2)}
    # => end mount: content data stays in the view
  end

  # => the template passes content into the card
  def render(assigns), do: ~H"<Ex23.Cards.card>open {@open}</Ex23.Cards.card>"
  # => end view: caller chooses the words
end

# => run/0 holds the whole example narrative
defmodule Ex23.Main do
  # => single entry point the last line calls
  def run do
    # => mount first, so the count assign exists
    {:ok, socket} = Ex23.Page.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => render wraps the inner content in the shell
    html =
      Ex23.Page.render(socket.assigns) |> Phoenix.HTML.Safe.to_iodata() |> IO.iodata_to_binary()

    # => Output: html: <section>open 2</section>
    IO.puts("html: #{html}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex23.Main.run()
