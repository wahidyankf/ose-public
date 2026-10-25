# => Kata 3 solution: validation pinned by a suite
Logger.configure(level: :warning)
# => warnings only; ExUnit stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => ExUnit runs the suite inside this script
ExUnit.start(auto_run: false, seed: 0)
# => no formatter output keeps the transcript fixed
ExUnit.configure(formatters: [])

# => one schema module names the member fields
defmodule Kata03s.Member do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => members persist under this source name
  schema "members" do
    # => the unique name a member chooses
    field(:handle, :string)
  end

  # => the boundary function the tests pin
  def changeset(member, attrs) do
    # => cast first, then require, then bound
    member
    |> cast(attrs, [:handle])
    |> validate_required([:handle])
    |> validate_length(:handle, min: 3)

    # => end changeset: handle must be present and long
  end

  # => module boundary stays explicit
end

# => one test module pins the boundary rules
defmodule Kata03s.MemberTest do
  # => tests run one after another here
  use ExUnit.Case, async: false

  # => the missing handle fails the required rule
  test "blank handle is invalid" do
    # => empty attrs miss the required field
    cs = Kata03s.Member.changeset(struct(Kata03s.Member), %{})
    # => validity and field are the assertions
    assert cs.valid? == false
    # => the error keys name the failed field
    assert :handle in Keyword.keys(cs.errors)
    # => end test: required rule pinned
  end

  # => the short handle fails the length rule
  test "short handle is invalid" do
    # => two characters miss the bound
    cs = Kata03s.Member.changeset(struct(Kata03s.Member), %{handle: "ab"})
    # => validity is the assertion again
    assert cs.valid? == false
    # => end test: length rule pinned
  end

  # => module boundary stays explicit
end

# => run/0 runs the suite and prints its numbers
defmodule Kata03s.Main do
  # => single entry point the last line calls
  def run do
    # => the suite output stays captured and discarded
    _output = ExUnit.CaptureIO.capture_io(fn -> send(self(), {:result, ExUnit.run()}) end)
    # => the result map carries the only printed numbers
    receive do
      # => Output: tests: 2 failures: 0
      {:result, result} ->
        IO.puts("tests: #{result.total} failures: #{result.failures}")
        # => end receive: two tests, zero failures
    end

    # => end run: the boundary stays pinned
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata03s.Main.run()
