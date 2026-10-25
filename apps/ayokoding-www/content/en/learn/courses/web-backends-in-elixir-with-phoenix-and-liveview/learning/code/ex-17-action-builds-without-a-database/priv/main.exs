# => Example 17: Action Builds Without a Database
Logger.configure(level: :warning)
# => warnings only; Ecto stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the member fields
defmodule Ex17.Member do
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
defmodule Ex17.Main do
  # => single entry point the last line calls
  def run do
    # => valid input applies into a struct, no repo
    # => struct plus attrs, validated first
    {:ok, member} =
      struct(Ex17.Member)
      # => the changeset carries the rules
      |> Ex17.Member.changeset(%{handle: "ada", age: 36})
      # => apply_action runs insert semantics in memory
      |> Ecto.Changeset.apply_action(:insert)

    # => Output: built: ada 36
    IO.puts("built: #{member.handle} #{member.age}")
    # => invalid input returns the changeset instead
    # => empty attrs fail the required handle
    {:error, failed} =
      struct(Ex17.Member)
      # => the same rules, the opposite outcome
      |> Ex17.Member.changeset(%{})
      # => apply_action refuses to build
      |> Ecto.Changeset.apply_action(:insert)

    # => Output: refused: false
    IO.puts("refused: #{failed.valid?}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex17.Main.run()
