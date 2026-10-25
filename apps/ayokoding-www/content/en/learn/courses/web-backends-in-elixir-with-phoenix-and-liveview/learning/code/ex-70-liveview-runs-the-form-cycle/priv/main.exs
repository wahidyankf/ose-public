# => Example 70: LiveView Runs the Form Cycle
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the handle field
defmodule Ex70.Handle do
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

    # => end changeset: both events run this
  end

  # => module boundary stays explicit
end

# => one LiveView module runs validate then save
defmodule Ex70.Form do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount starts from a blank attempted form
  def mount(_params, _session, socket) do
    # => status moves from blank to live to saved
    {:ok, assign(socket, status: "blank", errors: 0)}
    # => end mount: nothing typed, nothing saved
  end

  # => the validate event counts the current errors
  def handle_event("validate", %{"handle" => handle}, socket) do
    # => the changeset runs on the fresh input
    cs = Ex70.Handle.changeset(struct(Ex70.Handle), %{handle: handle})
    # => live names the validating state
    {:noreply, assign(socket, status: "live", errors: map_size(cs.errors |> Map.new()))}
    # => end validate: keystroke in, count out
  end

  # => the save event stores the valid handle
  def handle_event("save", %{"handle" => handle}, socket) do
    # => apply_action builds or refuses in memory
    case struct(Ex70.Handle)
         |> Ex70.Handle.changeset(%{handle: handle})
         |> Ecto.Changeset.apply_action(:insert) do
      # => the valid handle flips the status
      {:ok, _} ->
        {:noreply, assign(socket, status: "saved", errors: 0)}

      # => the invalid handle keeps the error count
      {:error, failed} ->
        {:noreply, assign(socket, status: "live", errors: map_size(failed.errors |> Map.new()))}
        # => end case: built or refused, both shown
    end

    # => end save: submit in, status out
  end

  # => the template reads the status assign
  def render(assigns), do: ~H"<p>status: {@status} errors: {@errors}</p>"
  # => end view: status in, line out
end

# => run/0 holds the whole example narrative
defmodule Ex70.Main do
  # => single entry point the last line calls
  def run do
    # => mount first, so the status assign exists
    {:ok, socket} = Ex70.Form.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => the visitor types a two-letter handle
    {:noreply, live} = Ex70.Form.handle_event("validate", %{"handle" => "ab"}, socket)
    # => Output: after type: live 1
    IO.puts("after type: #{live.assigns.status} #{live.assigns.errors}")
    # => the visitor saves too early and stays live
    {:noreply, refused} = Ex70.Form.handle_event("save", %{"handle" => "ab"}, live)
    # => Output: early save: live 1
    IO.puts("early save: #{refused.assigns.status} #{refused.assigns.errors}")
    # => the visitor completes the handle, then saves
    {:noreply, typed} = Ex70.Form.handle_event("validate", %{"handle" => "adanya"}, refused)
    # => the valid save flips the status
    {:noreply, saved} = Ex70.Form.handle_event("save", %{"handle" => "adanya"}, typed)
    # => Output: final save: saved 0
    IO.puts("final save: #{saved.assigns.status} #{saved.assigns.errors}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex70.Main.run()
