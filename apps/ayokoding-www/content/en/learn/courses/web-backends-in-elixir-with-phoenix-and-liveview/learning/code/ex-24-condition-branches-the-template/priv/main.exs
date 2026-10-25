# => Example 24: Condition Branches the Template
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module shows or hides one line
defmodule Ex24.Banner do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount seeds the flag the branch reads
  def mount(%{"show" => show}, _session, socket) do
    # => the string flag becomes a real boolean
    {:ok, assign(socket, show: show == "yes")}
    # => end mount: params decide the first branch
  end

  # => the template keeps one branch, drops one
  def render(assigns), do: ~H"<p :if={@show}>sale on</p><p :if={!@show}>sale off</p>"
  # => end view: assigns pick the branch
end

# => run/0 holds the whole example narrative
defmodule Ex24.Main do
  # => single entry point the last line calls
  def run do
    # => mount with the banner switched on
    {:ok, on} = Ex24.Banner.mount(%{"show" => "yes"}, %{}, struct(Phoenix.LiveView.Socket))
    # => only the sale-on paragraph survives
    on_html =
      Ex24.Banner.render(on.assigns) |> Phoenix.HTML.Safe.to_iodata() |> IO.iodata_to_binary()

    # => Output: on: <p>sale on</p>
    IO.puts("on: #{on_html}")
    # => mount with the banner switched off
    {:ok, off} = Ex24.Banner.mount(%{"show" => "no"}, %{}, struct(Phoenix.LiveView.Socket))
    # => only the sale-off paragraph survives
    off_html =
      Ex24.Banner.render(off.assigns) |> Phoenix.HTML.Safe.to_iodata() |> IO.iodata_to_binary()

    # => Output: off: <p>sale off</p>
    IO.puts("off: #{off_html}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex24.Main.run()
