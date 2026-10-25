# => Example 18: Mount Seeds Initial Assigns
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module owns the counter state
defmodule Ex18.Counter do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount runs once per connected process
  def mount(_params, _session, socket) do
    # => the counter starts at zero for everyone
    {:ok, assign(socket, count: 0)}
    # => end mount: state lives in the process
  end

  # => render turns the assigns into HTML later
  def render(assigns), do: ~H"<p>count: {@count}</p>"
  # => end view: mount first, render after
end

# => run/0 holds the whole example narrative
defmodule Ex18.Main do
  # => single entry point the last line calls
  def run do
    # => mount with no params and no session
    {:ok, socket} = Ex18.Counter.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => Output: count: 0
    IO.puts("count: #{socket.assigns.count}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex18.Main.run()
