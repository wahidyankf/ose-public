# => Example 48: Detect Schema Drift
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex48.Repo, migration_source: "ex48_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex48.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex48.Main do
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
    {:ok, _} = Ex48.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex48")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000148_make_widgets.exs"), ~S"""
    # => the table the migrator versions
    defmodule Ex48.Repo.Migrations.MakeWidgets do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the forward change
    create table(:ex48_widgets) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the versioned shape
    end
    # => end change: down drops what up created
    end
    # => end MakeWidgets: the file the drift escapes
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex48.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex48.Repo, "DROP TABLE IF EXISTS ex48_widgets", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex48.Repo, scratch, :up, all: true, log: false)
    # => drift lands outside the migrator, like a hotfix would
    Ecto.Adapters.SQL.query!(Ex48.Repo, "ALTER TABLE ex48_widgets ADD COLUMN sneaky text", [])
    # => the migrator still reports everything applied
    applied = Ecto.Migrator.migrations(Ex48.Repo, scratch)
    # => every file shows up from the migrator's side
    IO.puts("migrator: " <> Enum.map_join(applied, ", ", fn {s, _, _} -> "#{s}" end))
    # => the catalog tells the truth the history hides
    sql = "SELECT column_name FROM information_schema.columns"
    # => the filter names this unit's table
    sql = sql <> " WHERE table_name = 'ex48_widgets' ORDER BY ordinal_position"
    # => one call reads the real shape
    cols = Ecto.Adapters.SQL.query!(Ex48.Repo, sql, []).rows
    # => Output: drift: sneaky
    IO.puts("drift: " <> Enum.map_join(cols -- [["id"], ["label"]], ", ", fn [c] -> c end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex48.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex48.Main.run()
