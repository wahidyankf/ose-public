# => Kata 6 starter: validate counts nothing
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module ignores its own input
defmodule Kata06.Form do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount starts with zero errors counted
  def mount(_params, _session, socket) do
    # => errors stay zero without a changeset
    {:ok, assign(socket, errors: 0)}
    # => end mount: MISSING: the changeset check
  end

  # => the validate event answers without looking
  def handle_event("validate", _params, socket) do
    # => the input never reaches a changeset here
    {:noreply, socket}
    # => end event: silence instead of errors
  end

  # => the template counts the error lines
  def render(assigns), do: ~H"<p>errors: {@errors}</p>"
  # => end view: zero forever without a check
end

# => run/0 shows the uncounted errors
defmodule Kata06.Main do
  # => single entry point the last line calls
  def run do
    # => mount first, so the errors assign exists
    {:ok, socket} = Kata06.Form.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => the bad input changes nothing here
    {:noreply, next} = Kata06.Form.handle_event("validate", %{"handle" => "ab"}, socket)
    # => Output: errors: 0
    IO.puts("errors: #{next.assigns.errors}")

    # => end run: run the changeset, then count
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata06.Main.run()
