# => Example 14: Inclusion Picks the Role
Logger.configure(level: :warning)
# => warnings only; Ecto stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the account fields
defmodule Ex14.Account do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => accounts persist under this source name
  schema "accounts" do
    # => the unique name a member chooses
    field(:handle, :string)
    # => one of the three known roles
    field(:role, :string)
  end

  # => unknown roles never reach the web layer
  def changeset(account, attrs) do
    # => cast first, then require, then restrict
    account
    |> cast(attrs, [:handle, :role])
    |> validate_required([:handle, :role])
    |> validate_inclusion(:role, ["reader", "writer", "admin"])

    # => end changeset: the list is the whole vocabulary
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex14.Main do
  # => single entry point the last line calls
  def run do
    # => writer sits inside the vocabulary
    known = Ex14.Account.changeset(struct(Ex14.Account), %{handle: "ada", role: "writer"})
    # => Output: known: true
    IO.puts("known: #{known.valid?}")
    # => owner sits outside of it
    strange = Ex14.Account.changeset(struct(Ex14.Account), %{handle: "ada", role: "owner"})
    # => Output: strange: false
    IO.puts("strange: #{strange.valid?}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex14.Main.run()
