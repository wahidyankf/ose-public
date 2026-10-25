# => Kata 6 solution: validate counts real errors
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the handle field
defmodule Kata06s.Handle do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => handles persist under this source name
  schema "handles" do
    # => the unique name a member chooses
    field(:handle, :string)
  end

  # => three characters minimum, as before
  def changeset(handle, attrs) do
    # => cast first, then require, then bound
    handle
    |> cast(attrs, [:handle])
    |> validate_required([:handle])
    |> validate_length(:handle, min: 3)

    # => end changeset: every keystroke re-runs this
  end

  # => module boundary stays explicit
end

# => one LiveView module validates each keystroke
defmodule Kata06s.Form do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount starts from an empty changeset
  def mount(_params, _session, socket) do
    # => the form assign carries the first errors
    {:ok, assign(socket, errors: [])}
    # => end mount: empty form, empty errors
  end

  # => the validate event re-checks the typed handle
  def handle_event("validate", %{"handle" => handle}, socket) do
    # => the changeset runs on the fresh input
    cs = Kata06s.Handle.changeset(struct(Kata06s.Handle), %{handle: handle})
    # => traverse_errors turns tuples into sentences
    errors = Ecto.Changeset.traverse_errors(cs, fn {msg, _opts} -> msg end)
    # => the error list becomes the next state
    {:noreply, assign(socket, errors: errors[:handle] || [])}
    # => end event: keystroke in, errors out
  end

  # => the template counts the error lines
  def render(assigns), do: ~H"<p>errors: {length(@errors)}</p>"
  # => end view: errors shape the page
end

# => run/0 counts the errors the starter missed
defmodule Kata06s.Main do
  # => single entry point the last line calls
  def run do
    # => mount first, so the errors assign exists
    {:ok, socket} = Kata06s.Form.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => the bad input now counts one error
    {:noreply, next} = Kata06s.Form.handle_event("validate", %{"handle" => "ab"}, socket)
    # => Output: errors: 1
    IO.puts("errors: #{length(next.assigns.errors)}")

    # => end run: keystrokes always meet the changeset
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata06s.Main.run()
