# => Example 64: Submit Refuses Bad Input
Logger.configure(level: :warning)
# => warnings only; Ecto stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the member fields
defmodule Ex64.Member do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => members persist under this source name
  schema "members" do
    # => the unique name a member chooses
    field(:handle, :string)
  end

  # => the boundary function every submit runs
  def changeset(member, attrs) do
    # => cast first, then require, then bound
    member
    |> cast(attrs, [:handle])
    |> validate_required([:handle])
    |> validate_length(:handle, min: 3)

    # => end changeset: short handles never save
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex64.Main do
  # => single entry point the last line calls
  def run do
    # => invalid params return the failed changeset
    # => a two-letter handle fails the bound
    {:error, failed} =
      struct(Ex64.Member)
      # => the same rules, the opposite outcome
      |> Ex64.Member.changeset(%{handle: "ab"})
      # => apply_action refuses to build
      |> Ecto.Changeset.apply_action(:insert)

    # => traverse_errors turns tuples into sentences
    messages = Ecto.Changeset.traverse_errors(failed, fn {msg, _opts} -> msg end)
    # => Output: refused: should be at least 3 character(s)
    IO.puts("refused: #{messages[:handle] |> hd() |> String.replace("%{count}", "3")}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex64.Main.run()
