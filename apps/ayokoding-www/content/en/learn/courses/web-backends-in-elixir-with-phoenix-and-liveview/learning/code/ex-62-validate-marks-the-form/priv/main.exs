# => Example 62: Validate Marks the Form
Logger.configure(level: :warning)
# => warnings only; Ecto stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the handle field
defmodule Ex62.Handle do
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

    # => end changeset: every submit re-runs this
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex62.Main do
  # => single entry point the last line calls
  def run do
    # => the visitor submits a two-letter handle
    # => struct plus params, validated first
    cs =
      struct(Ex62.Handle)
      # => the changeset carries the rules
      |> Ex62.Handle.changeset(%{handle: "ab"})
      # => validate marks the form attempted
      |> Map.put(:action, :validate)

    # => to_form bridges the changeset to the template
    form = Phoenix.Component.to_form(cs, as: "handle")
    # => Output: errors: 1
    IO.puts("errors: #{length(form.errors)}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex62.Main.run()
