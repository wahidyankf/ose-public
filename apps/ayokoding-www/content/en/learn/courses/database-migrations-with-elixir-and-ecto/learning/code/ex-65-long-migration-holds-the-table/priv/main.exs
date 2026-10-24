# => Example 65: Long Migration Holds the Table
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex65.Repo, migration_source: "ex65_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex65.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex65.Main do
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
    {:ok, _} = Ex65.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex65")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000165_make_widgets.exs"), ~S"""
    # => the table the lock demonstration holds
    defmodule Ex65.Repo.Migrations.MakeWidgets do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the forward change
    create table(:ex65_widgets) do
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
    Ecto.Migrator.run(Ex65.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex65.Repo, "DROP TABLE IF EXISTS ex65_widgets", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex65.Repo, scratch, :up, all: true, log: false)
    # => the transaction holds the table lock
    Ex65.Repo.transaction(fn ->
      # => ACCESS EXCLUSIVE is what migrations hold during DDL
      Ecto.Adapters.SQL.query!(Ex65.Repo, "LOCK TABLE ex65_widgets IN ACCESS EXCLUSIVE MODE", [])
      # => the observer runs on its own pool connection
      # => the task runs on its own process and connection
      observer =
        Task.async(fn ->
          # => the lock catalog counts the held table lock
          sql = "SELECT count(*) FROM pg_locks"
          # => the filter names the table and the DDL mode
          # => second half carries the table-and-mode predicate
          sql =
            sql <> " WHERE relation = 'ex65_widgets'::regclass AND mode = 'AccessExclusiveLock'"

          # => one call counts the held lock
          [[held]] = Ecto.Adapters.SQL.query!(Ex65.Repo, sql, []).rows
          # => the observer returns the count to the script
          held
          # => end observer: the count travels back over the task
        end)

      # => Output: held: 1
      IO.puts("held: #{Task.await(observer)}")
      # => end transaction: commit releases the lock
    end)

    # => the lock catalog shows no table lock after commit
    sql = "SELECT count(*) FROM pg_locks"
    # => the filter names the table and the DDL mode
    sql = sql <> " WHERE relation = 'ex65_widgets'::regclass AND mode = 'AccessExclusiveLock'"
    # => one call counts the released lock
    [[gone]] = Ecto.Adapters.SQL.query!(Ex65.Repo, sql, []).rows
    # => Output: released: 0
    IO.puts("released: #{gone}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex65.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex65.Main.run()
