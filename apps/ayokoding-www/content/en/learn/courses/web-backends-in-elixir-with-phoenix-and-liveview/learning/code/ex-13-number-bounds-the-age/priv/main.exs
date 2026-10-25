# => Example 13: Number Bounds the Age
Logger.configure(level: :warning)
# => warnings only; Ecto stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the member fields
defmodule Ex13.Member do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => members persist under this source name
  schema "members" do
    # => the unique name a member chooses
    field(:handle, :string)
    # => full years, bounded below
    field(:age, :integer)
  end

  # => members are at least thirteen here
  def changeset(member, attrs) do
    # => cast first, then require, then compare
    member
    |> cast(attrs, [:handle, :age])
    |> validate_required([:handle, :age])
    |> validate_number(:age, greater_than_or_equal_to: 13)

    # => end changeset: twelve fails, thirteen passes
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex13.Main do
  # => single entry point the last line calls
  def run do
    # => twelve falls below the bound
    young = Ex13.Member.changeset(struct(Ex13.Member), %{handle: "ada", age: 12})
    # => Output: young: false
    IO.puts("young: #{young.valid?}")
    # => thirteen meets the bound exactly
    teen = Ex13.Member.changeset(struct(Ex13.Member), %{handle: "ada", age: 13})
    # => Output: teen: true
    IO.puts("teen: #{teen.valid?}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex13.Main.run()
