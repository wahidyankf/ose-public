# => Example 67: Constraint Waits for the Database
Logger.configure(level: :warning)
# => warnings only; Ecto stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the member fields
defmodule Ex67.Member do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => members persist under this source name
  schema "members" do
    # => the unique name a member chooses
    field(:handle, :string)
  end

  # => uniqueness enforced by the database, not memory
  def changeset(member, attrs) do
    # => unique_constraint records the index to watch
    member |> cast(attrs, [:handle]) |> validate_required([:handle]) |> unique_constraint(:handle)
    # => end changeset: valid now, checked on insert
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex67.Main do
  # => single entry point the last line calls
  def run do
    # => the changeset stays valid without a repo
    cs = Ex67.Member.changeset(struct(Ex67.Member), %{handle: "ada"})
    # => Output: valid: true constraints: 1
    IO.puts("valid: #{cs.valid?} constraints: #{length(cs.constraints)}")
    # => the recorded constraint names its index
    [only] = cs.constraints
    # => Output: index: members_handle_index
    IO.puts("index: #{only.constraint}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex67.Main.run()
