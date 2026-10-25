# => Example 65: Checkbox Casts to Boolean
Logger.configure(level: :warning)
# => warnings only; Ecto stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the preference fields
defmodule Ex65.Prefs do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => preferences persist under this source name
  schema "prefs" do
    # => the unique name a member chooses
    field(:handle, :string)
    # => the newsletter checkbox state
    field(:subscribed, :boolean)
  end

  # => checkboxes arrive as strings from the form
  def changeset(prefs, attrs) do
    # => cast converts "true" into a real boolean
    prefs |> cast(attrs, [:handle, :subscribed]) |> validate_required([:handle])
    # => end changeset: strings in, booleans out
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex65.Main do
  # => single entry point the last line calls
  def run do
    # => the checked box arrives as the string true
    checked = Ex65.Prefs.changeset(struct(Ex65.Prefs), %{handle: "ada", subscribed: "true"})
    # => Output: checked: true
    IO.puts("checked: #{Ecto.Changeset.get_field(checked, :subscribed)}")
    # => the unchecked box arrives as the string false
    unchecked = Ex65.Prefs.changeset(struct(Ex65.Prefs), %{handle: "ada", subscribed: "false"})
    # => Output: unchecked: false
    IO.puts("unchecked: #{Ecto.Changeset.get_field(unchecked, :subscribed)}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex65.Main.run()
