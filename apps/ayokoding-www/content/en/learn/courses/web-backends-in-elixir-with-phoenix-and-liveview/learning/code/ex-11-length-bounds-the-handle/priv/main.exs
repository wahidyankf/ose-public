# => Example 11: Length Bounds the Handle
Logger.configure(level: :warning)
# => warnings only; Ecto stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the member fields
defmodule Ex11.Member do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => members persist under this source name
  schema "members" do
    # => the unique name a member chooses
    field(:handle, :string)
  end

  # => handles run 3 to 12 characters here
  def changeset(member, attrs) do
    # => cast first, then require, then bound
    member
    |> cast(attrs, [:handle])
    |> validate_required([:handle])
    |> validate_length(:handle, min: 3, max: 12)

    # => end changeset: short and long both fail
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex11.Main do
  # => single entry point the last line calls
  def run do
    # => two characters are too few
    short = Ex11.Member.changeset(struct(Ex11.Member), %{handle: "ab"})
    # => Output: short: false
    IO.puts("short: #{short.valid?}")
    # => thirteen characters are too many
    long = Ex11.Member.changeset(struct(Ex11.Member), %{handle: "abcdefghijklm"})
    # => Output: long: false
    IO.puts("long: #{long.valid?}")
    # => five characters sit inside the bounds
    just = Ex11.Member.changeset(struct(Ex11.Member), %{handle: "adanya"})
    # => Output: just: true
    IO.puts("just: #{just.valid?}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex11.Main.run()
