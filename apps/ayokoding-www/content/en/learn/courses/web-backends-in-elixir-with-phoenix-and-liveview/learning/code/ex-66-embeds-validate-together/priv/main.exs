# => Example 66: Embeds Validate Together
Logger.configure(level: :warning)
# => warnings only; Ecto stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one embedded schema names the address fields
defmodule Ex66.Address do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => embedded rows carry no primary key
  @primary_key false

  # => addresses live inside their account
  embedded_schema do
    # => the street line of the address
    field(:street, :string)
    # => the city line of the address
    field(:city, :string)
  end

  # => both lines required together
  def changeset(address, attrs) do
    # => cast both, require both
    address |> cast(attrs, [:street, :city]) |> validate_required([:street, :city])
    # => end changeset: half an address fails
  end

  # => module boundary stays explicit
end

# => one schema module owns the account plus address
defmodule Ex66.Account do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => accounts persist under this source name
  schema "accounts" do
    # => the unique name a member chooses
    field(:handle, :string)
    # => the address nests inside the account
    embeds_one(:address, Ex66.Address)
  end

  # => the parent validates, then the embed
  def changeset(account, attrs) do
    # => one submit crosses two schemas at once
    # => cast_embed runs the address changeset inside
    account
    |> cast(attrs, [:handle])
    |> validate_required([:handle])
    |> cast_embed(:address, required: true)

    # => end changeset: one form, two levels
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex66.Main do
  # => single entry point the last line calls
  def run do
    # => a full address passes both levels
    full =
      Ex66.Account.changeset(struct(Ex66.Account), %{
        handle: "ada",
        address: %{street: "jl mawar", city: "bandung"}
      })

    # => Output: full: true
    IO.puts("full: #{full.valid?}")
    # => a half address fails the nested level
    half =
      Ex66.Account.changeset(struct(Ex66.Account), %{
        handle: "ada",
        address: %{street: "jl mawar"}
      })

    # => Output: half: false
    IO.puts("half: #{half.valid?}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex66.Main.run()
