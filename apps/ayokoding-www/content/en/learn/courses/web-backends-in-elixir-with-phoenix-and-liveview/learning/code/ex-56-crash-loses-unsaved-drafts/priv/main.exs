# => Example 56: Crash Loses Unsaved Drafts
Logger.configure(level: :critical)
# => crash reports stay out of the transcript
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one GenServer module holds one editor draft
defmodule Ex56.Draft do
  # => GenServer callbacks live here
  use GenServer

  # => clients start one draft holder
  def start_link(_opts), do: GenServer.start_link(__MODULE__, "")

  # => the draft starts empty after every boot
  def init(first), do: {:ok, first}

  # => type replaces the draft with longer text
  def handle_call({:type, text}, _from, _draft), do: {:reply, :ok, text}

  # => read returns the draft without changing it
  def handle_call(:read, _from, draft), do: {:reply, draft, draft}
end

# => run/0 holds the whole example narrative
defmodule Ex56.Main do
  # => single entry point the last line calls
  def run do
    # => one supervision tree owns the draft holder
    {:ok, sup} = Supervisor.start_link([{Ex56.Draft, []}], strategy: :one_for_one)
    # => the single child answers under a known id
    [{_, holder, _, _}] = Supervisor.which_children(sup)
    # => the visitor types half a sentence
    GenServer.call(holder, {:type, "dear diary"})
    # => the process crashes before any save
    :ok = GenServer.stop(holder, :boom)
    # => the supervisor booted a fresh holder
    [{_, fresh, _, _}] = Supervisor.which_children(sup)
    # => Output: draft after crash: empty
    IO.puts(
      "draft after crash: #{if GenServer.call(fresh, :read) == "", do: "empty", else: "kept"}"
    )

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex56.Main.run()
