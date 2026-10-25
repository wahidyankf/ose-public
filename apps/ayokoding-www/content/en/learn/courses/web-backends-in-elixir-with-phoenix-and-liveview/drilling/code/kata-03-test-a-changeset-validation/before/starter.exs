# => Kata 3 starter: validation nobody pins down
Logger.configure(level: :warning)
# => warnings only; Ecto stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the member fields
defmodule Kata03.Member do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => members persist under this source name
  schema "members" do
    # => the unique name a member chooses
    field(:handle, :string)
  end

  # => the boundary function the test will pin
  def changeset(member, attrs) do
    # => cast first, then require, then bound
    member
    |> cast(attrs, [:handle])
    |> validate_required([:handle])
    |> validate_length(:handle, min: 3)

    # => end changeset: MISSING: a test that pins this
  end

  # => module boundary stays explicit
end

# => run/0 prints validity without asserting it
defmodule Kata03.Main do
  # => single entry point the last line calls
  def run do
    # => empty attrs look invalid, nobody asserts it
    cs = Kata03.Member.changeset(struct(Kata03.Member), %{})
    # => Output: valid: false
    IO.puts("valid: #{cs.valid?}")

    # => end run: wrap this in a suite that asserts
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata03.Main.run()
