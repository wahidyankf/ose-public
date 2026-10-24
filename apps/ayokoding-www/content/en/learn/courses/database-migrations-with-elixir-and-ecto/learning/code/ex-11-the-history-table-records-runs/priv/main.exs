# => Example 11: The History Table Records Runs
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex11.Repo, migration_source: "ex11_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex11.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex11.Main do
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
    {:ok, _} = Ex11.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex11")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000111_make_widgets.exs"), ~S"""
    # => one file in an ordered line of three
    defmodule Ex11.Repo.Migrations.MakeWidgets do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => versions not names decide the running order
    def change do
    # => one table per file keeps the line readable
    create table(:ex11_widgets) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the table lands with its column
    end
    # => end change: down drops what up created
    end
    # => end MakeWidgets: this file is one step of the line
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex11.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex11.Repo, "DROP TABLE IF EXISTS ex11_widgets", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex11.Repo, scratch, :up, all: true, log: false)
    # => the history table has exactly two columns
    sql = "SELECT column_name FROM information_schema.columns"
    # => the filter names the history table
    sql = sql <> " WHERE table_name = 'ex11_history' ORDER BY ordinal_position"
    # => one call reads the history shape
    cols = Ecto.Adapters.SQL.query!(Ex11.Repo, sql, []).rows
    # => Output: history columns: version, inserted_at
    IO.puts("history columns: " <> Enum.map_join(cols, ", ", fn [c] -> c end))
    # => the receipts prove the run
    sql = "SELECT version FROM ex11_history "
    # => this unit owns one version
    sql = sql <> "WHERE version = 202601000111"
    # => one call runs the catalog probe
    versions = Ecto.Adapters.SQL.query!(Ex11.Repo, sql, []).rows
    # => Output: recorded: 202601000111
    IO.puts("recorded: " <> Enum.map_join(versions, ", ", fn [v] -> "#{v}" end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex11.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex11.Main.run()
