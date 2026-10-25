# => Example 9: Changeset Accepts Valid Input
Logger.configure(level: :warning)
# => warnings only; Ecto stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the member fields
defmodule Ex09.Member do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => members persist under this source name
  schema "members" do
    # => the unique name a member chooses
    field(:handle, :string)
    # => full years, optional at the boundary
    field(:age, :integer)
  end

  # => the boundary function every example reuses
  def changeset(member, attrs) do
    # => cast keeps only the listed fields
    member |> cast(attrs, [:handle, :age]) |> validate_required([:handle])
    # => end changeset: handle must be present
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex09.Main do
  # => single entry point the last line calls
  def run do
    # => input with every required field present
    cs = Ex09.Member.changeset(struct(Ex09.Member), %{handle: "ada", age: 36})
    # => Output: valid: true changes: age handle
    IO.puts(
      "valid: #{cs.valid?} changes: #{cs.changes |> Map.keys() |> Enum.sort() |> Enum.join(" ")}"
    )

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex09.Main.run()
