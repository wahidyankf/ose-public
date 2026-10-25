# => Example 25: Empty Database Migrates Cleanly
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex25.Repo, migration_source: "ex25_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex25.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex25.Main do
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
    {:ok, _} = Ex25.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex25")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000125_make_widgets.exs"), ~S"""
    # => the table a history-less database bootstraps
    defmodule Ex25.Repo.Migrations.MakeWidgets do
    # => up creates the history table itself when it is missing
    use Ecto.Migration

    # => the first file on an empty database
    def change do
    # => one table proves the bootstrap worked
    create table(:ex25_widgets) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the database is no longer empty
    end
    # => end change: down returns it to empty
    end
    # => end MakeWidgets: the bootstrap file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex25.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex25.Repo, "DROP TABLE IF EXISTS ex25_widgets", [])

    # => start from a database with no history table at all
    Ecto.Adapters.SQL.query!(Ex25.Repo, "DROP TABLE ex25_history", [])
    # => up bootstraps its own history table
    Ecto.Migrator.run(Ex25.Repo, scratch, :up, all: true, log: false)
    # => the receipts prove the bootstrap recorded the run
    # => the filter keeps other units' rows out of the transcript
    sql = "SELECT version FROM ex25_history WHERE version = 202601000125"
    # => one call reads the bootstrapped row
    versions = Ecto.Adapters.SQL.query!(Ex25.Repo, sql, []).rows
    # => Output: recorded: 202601000125
    IO.puts("recorded: " <> Enum.map_join(versions, ", ", fn [v] -> "#{v}" end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex25.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex25.Main.run()
