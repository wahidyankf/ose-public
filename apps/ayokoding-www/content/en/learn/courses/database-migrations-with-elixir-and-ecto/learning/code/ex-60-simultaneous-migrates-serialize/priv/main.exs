# => Example 60: Simultaneous Migrates Serialize
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
# => the advisory lock serializes whole runs, not just statements
# => one list holds both keys; a second put would wipe the first
repo_env = [migration_source: "ex60_history", migration_lock: :pg_advisory_lock]
# => a single put keeps history and lock configured together
Application.put_env(:app, Ex60.Repo, repo_env)

# => one Repo module per unit keeps names unambiguous
defmodule Ex60.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex60.Main do
  # => single entry point the last line calls
  def run do
    # => one keyword list owns every connection fact
    opts = [
      # => harness service hostname
      hostname: System.get_env("PGHOST", "postgres"),
      # => service port, parsed once
      port: System.get_env("PGPORT", "5432") |> String.to_integer(),
      # => fresh database for every run
      database: System.get_env("PGDATABASE", "postgres"),
      # => trust-auth role, no password
      username: System.get_env("PGUSER", "postgres"),
      # => Repo stays silent; the transcript is explicit
      log: false
      # => end opts: every fact above is environment-driven
    ]

    # => pool starts; the script owns the rest
    {:ok, _} = Ex60.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex60")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000160_make_pair.exs"), ~S"""
    # => one table both racers migrate together
    defmodule Ex60.Repo.Migrations.MakePair do
    # => the lock serializes the two runners
    use Ecto.Migration

    # => the table both runners create once
    def change do
    # => the table the race migrates
    create table(:ex60_widgets) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: one table, two runners
    end
    # => end change: the second runner finds it applied
    end
    # => end MakePair: the contested file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex60.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex60.Repo, "DROP TABLE IF EXISTS ex60_widgets", [])

    # => the advisory lock from above serializes these two runs
    # => history and lock share one configuration, set once
    # => preload the file so the tasks never compile it twice
    Code.require_file(Path.join(scratch, "202601000160_make_pair.exs"))
    # => two runners start the same migration at once
    first =
      Task.async(fn -> Ecto.Migrator.run(Ex60.Repo, scratch, :up, all: true, log: false) end)

    # => the second runner joins the same race
    second =
      Task.async(fn -> Ecto.Migrator.run(Ex60.Repo, scratch, :up, all: true, log: false) end)

    # => the loser waits one retry beat, then finds nothing pending
    outcomes = Task.await_many([first, second], 60_000)
    # => sorted outcomes read the same on every run
    # => Output: outcomes: [[], [202601000160]]
    IO.puts("outcomes: #{inspect(Enum.sort(outcomes))}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex60.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex60.Main.run()
