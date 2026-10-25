# => Example 10: Required Field Errors Loudly
Logger.configure(level: :warning)
# => warnings only; Ecto stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the member fields
defmodule Ex10.Member do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => members persist under this source name
  schema "members" do
    # => the unique name a member chooses
    field(:handle, :string)
  end

  # => the boundary function every example reuses
  def changeset(member, attrs) do
    # => cast keeps only the listed fields
    member |> cast(attrs, [:handle]) |> validate_required([:handle])
    # => end changeset: handle must be present
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex10.Main do
  # => single entry point the last line calls
  def run do
    # => input with the required handle missing
    cs = Ex10.Member.changeset(struct(Ex10.Member), %{})
    # => Output: valid: false errors: handle
    IO.puts("valid: #{cs.valid?} errors: #{cs.errors |> Keyword.keys() |> Enum.join(" ")}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex10.Main.run()
