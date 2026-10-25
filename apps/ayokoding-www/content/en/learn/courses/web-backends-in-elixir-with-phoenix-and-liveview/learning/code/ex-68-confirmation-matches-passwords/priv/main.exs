# => Example 68: Confirmation Matches Passwords
Logger.configure(level: :warning)
# => warnings only; Ecto stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the password fields
defmodule Ex68.Account do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => accounts persist under this source name
  schema "accounts" do
    # => the unique name a member chooses
    field(:handle, :string)
    # => the secret typed once
    field(:password, :string)
    # => the secret typed twice
    field(:password_confirmation, :string)
  end

  # => both typings must agree before saving
  def changeset(account, attrs) do
    # => cast both, require one, compare the pair
    account
    |> cast(attrs, [:handle, :password])
    |> validate_required([:handle, :password])
    |> validate_confirmation(:password)

    # => end changeset: mismatch fails the pair
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex68.Main do
  # => single entry point the last line calls
  def run do
    # => matching typings pass the comparison
    match =
      Ex68.Account.changeset(struct(Ex68.Account), %{
        handle: "ada",
        password: "s3cret",
        password_confirmation: "s3cret"
      })

    # => Output: match: true
    IO.puts("match: #{match.valid?}")
    # => differing typings fail it
    mismatch =
      Ex68.Account.changeset(struct(Ex68.Account), %{
        handle: "ada",
        password: "s3cret",
        password_confirmation: "nope"
      })

    # => Output: mismatch: false
    IO.puts("mismatch: #{mismatch.valid?}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex68.Main.run()
