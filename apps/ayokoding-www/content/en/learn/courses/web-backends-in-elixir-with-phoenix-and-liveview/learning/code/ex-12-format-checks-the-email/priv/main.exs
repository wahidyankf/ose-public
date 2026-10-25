# => Example 12: Format Checks the Email
Logger.configure(level: :warning)
# => warnings only; Ecto stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the contact fields
defmodule Ex12.Contact do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => contacts persist under this source name
  schema "contacts" do
    # => the address replies go to
    field(:email, :string)
  end

  # => a small pattern keeps obvious typos out
  def changeset(contact, attrs) do
    # => cast first, then require, then match
    contact
    |> cast(attrs, [:email])
    |> validate_required([:email])
    |> validate_format(:email, ~r/^[^@\s]+@[^@\s]+$/)

    # => end changeset: one at-sign, no spaces
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex12.Main do
  # => single entry point the last line calls
  def run do
    # => a plain address passes the pattern
    good = Ex12.Contact.changeset(struct(Ex12.Contact), %{email: "ada@example.com"})
    # => Output: good: true
    IO.puts("good: #{good.valid?}")
    # => a string with no at-sign fails it
    bad = Ex12.Contact.changeset(struct(Ex12.Contact), %{email: "not-an-email"})
    # => Output: bad: false
    IO.puts("bad: #{bad.valid?}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex12.Main.run()
