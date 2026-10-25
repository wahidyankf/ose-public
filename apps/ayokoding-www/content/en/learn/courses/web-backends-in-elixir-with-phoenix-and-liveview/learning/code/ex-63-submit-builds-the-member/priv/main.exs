# => Example 63: Submit Builds the Member
Logger.configure(level: :warning)
# => warnings only; Ecto stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the member fields
defmodule Ex63.Member do
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

  # => the boundary function every submit runs
  def changeset(member, attrs) do
    # => cast keeps only the listed fields
    member |> cast(attrs, [:handle, :age]) |> validate_required([:handle])
    # => end changeset: handle must be present
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex63.Main do
  # => single entry point the last line calls
  def run do
    # => valid params apply into a struct, no repo
    # => struct plus params, validated first
    {:ok, member} =
      struct(Ex63.Member)
      # => the changeset carries the rules
      |> Ex63.Member.changeset(%{handle: "ada", age: 36})
      # => apply_action runs insert semantics in memory
      |> Ecto.Changeset.apply_action(:insert)

    # => Output: saved: ada 36
    IO.puts("saved: #{member.handle} #{member.age}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex63.Main.run()
