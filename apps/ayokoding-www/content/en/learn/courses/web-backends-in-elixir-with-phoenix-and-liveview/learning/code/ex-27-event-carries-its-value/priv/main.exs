# => Example 27: Event Carries Its Value
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module picks one of three tabs
defmodule Ex27.Tabs do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount selects the first tab for everyone
  def mount(_params, _session, socket) do
    # => the tab assign names the visible panel
    {:ok, assign(socket, tab: "orders")}
    # => end mount: orders until the visitor chooses
  end

  # => the select event carries the tab value
  def handle_event("select", %{"tab" => tab}, socket) do
    # => the payload decides the next state
    {:noreply, assign(socket, tab: tab)}
    # => end event: value in, tab out
  end

  # => the template reads the tab assign
  def render(assigns), do: ~H"<p>tab: {@tab}</p>"
  # => end view: value in, panel out
end

# => run/0 holds the whole example narrative
defmodule Ex27.Main do
  # => single entry point the last line calls
  def run do
    # => mount first, so the tab assign exists
    {:ok, socket} = Ex27.Tabs.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => the visitor picks the payments tab
    {:noreply, next} = Ex27.Tabs.handle_event("select", %{"tab" => "payments"}, socket)
    # => Output: tab: payments
    IO.puts("tab: #{next.assigns.tab}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex27.Main.run()
