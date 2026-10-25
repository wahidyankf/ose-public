# => Example 15: Custom Rule Rejects Reserved
Logger.configure(level: :warning)
# => warnings only; Ecto stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the member fields
defmodule Ex15.Member do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => members persist under this source name
  schema "members" do
    # => the unique name a member chooses
    field(:handle, :string)
  end

  # => admin and root stay reserved forever
  def changeset(member, attrs) do
    # => cast first, then require, then the custom rule
    member
    # => the pipeline reads top to bottom
    |> cast(attrs, [:handle])
    # => presence still comes first
    |> validate_required([:handle])
    # => the custom rule sees the cast handle
    |> validate_change(:handle, fn :handle, handle ->
      # => reserved names collect one error
      if handle in ["admin", "root"], do: [handle: "is reserved"], else: []
      # => end rule: anything else passes through
    end)

    # => end changeset: built-ins plus one custom step
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex15.Main do
  # => single entry point the last line calls
  def run do
    # => admin is reserved by policy
    taken = Ex15.Member.changeset(struct(Ex15.Member), %{handle: "admin"})
    # => Output: taken: false
    IO.puts("taken: #{taken.valid?}")
    # => operator is an ordinary name
    free = Ex15.Member.changeset(struct(Ex15.Member), %{handle: "operator"})
    # => Output: free: true
    IO.puts("free: #{free.valid?}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex15.Main.run()
