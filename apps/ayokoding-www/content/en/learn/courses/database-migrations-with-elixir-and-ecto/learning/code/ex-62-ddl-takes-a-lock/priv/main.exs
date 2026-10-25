# => Example 62: DDL Takes a Lock
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex62.Repo, migration_source: "ex62_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex62.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex62.Main do
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
    {:ok, _} = Ex62.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex62")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000162_make_widgets.exs"), ~S"""
    # => the table the lock demonstration holds
    defmodule Ex62.Repo.Migrations.MakeWidgets do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the forward change
    create table(:ex62_widgets) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the table the lock covers
    end
    # => end change: down drops what up created
    end
    # => end MakeWidgets: the locked table
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex62.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex62.Repo, "DROP TABLE IF EXISTS ex62_widgets", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex62.Repo, scratch, :up, all: true, log: false)
    # => hold the exact lock DDL takes, in one transaction
    # => the transaction holds the lock window
    held =
      Ex62.Repo.transaction(fn ->
        # => ACCESS EXCLUSIVE is what CREATE and ALTER take
        sql = "LOCK TABLE ex62_widgets IN ACCESS EXCLUSIVE MODE"
        # => one call takes the exclusive lock
        Ecto.Adapters.SQL.query!(Ex62.Repo, sql, [])

        # => the lock catalog names our own lock
        sql = "SELECT mode FROM pg_locks"
        # => the predicate names our table and process
        sql = sql <> " WHERE relation = 'ex62_widgets'::regclass AND pid = pg_backend_pid()"

        # => one call reads the held mode
        [[mode]] = Ecto.Adapters.SQL.query!(Ex62.Repo, sql, []).rows
        # => the transaction returns the mode to the script
        mode
        # => end transaction: the lock releases on commit
      end)

    # => Output: lock: AccessExclusiveLock
    IO.puts("lock: #{elem(held, 1)}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex62.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex62.Main.run()
