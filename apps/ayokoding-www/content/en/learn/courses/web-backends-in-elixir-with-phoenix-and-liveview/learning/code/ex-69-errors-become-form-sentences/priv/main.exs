# => Example 69: Errors Become Form Sentences
Logger.configure(level: :warning)
# => warnings only; Ecto stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the signup fields
defmodule Ex69.Signup do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => signups persist under this source name
  schema "signups" do
    # => the unique name a member chooses
    field(:handle, :string)
    # => the address replies go to
    field(:email, :string)
  end

  # => both fields validated at once
  def changeset(signup, attrs) do
    # => cast both, require both, bound one
    signup
    |> cast(attrs, [:handle, :email])
    |> validate_required([:handle, :email])
    |> validate_length(:handle, min: 3)

    # => end changeset: two failures possible
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex69.Main do
  # => single entry point the last line calls
  def run do
    # => a short handle and a missing email fail together
    cs = Ex69.Signup.changeset(struct(Ex69.Signup), %{handle: "ab"})
    # => traverse_errors turns tuples into sentences
    messages = Ecto.Changeset.traverse_errors(cs, fn {msg, _opts} -> msg end)
    # => the fields sort themselves for the transcript
    fields = messages |> Map.keys() |> Enum.sort() |> Enum.join(" ")
    # => Output: fields: email handle
    IO.puts("fields: #{fields}")
    # => the email sentence reads ready for the form
    [email_sentence] = messages[:email]
    # => Output: email says: can't be blank
    IO.puts("email says: #{email_sentence}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex69.Main.run()
