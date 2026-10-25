# => Example 19: Rollback Keeps Unrelated Data
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex19.Repo, migration_source: "ex19_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex19.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex19.Main do
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
    {:ok, _} = Ex19.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex19")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000119_make_widgets.exs"), ~S"""
    # => the migration manages one table only
    defmodule Ex19.Repo.Migrations.MakeWidgets do
    # => down drops exactly this table, nothing else
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => the table rollback will drop
    create table(:ex19_drop) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the migration's only table
    end
    # => end change: the migrator owns this table alone
    end
    # => end MakeWidgets: unrelated tables stay outside
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex19.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex19.Repo, "DROP TABLE IF EXISTS ex19_drop", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex19.Repo, "DROP TABLE IF EXISTS ex19_keep", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex19.Repo, scratch, :up, all: true, log: false)
    # => unrelated data lives in a table no migration owns
    Ecto.Adapters.SQL.query!(Ex19.Repo, "CREATE TABLE ex19_keep (label text)", [])
    # => the row lands outside the migrator's reach
    Ecto.Adapters.SQL.query!(Ex19.Repo, "INSERT INTO ex19_keep (label) VALUES ('ada')", [])
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex19.Repo, scratch, :down, to: 0, log: false)
    # => the kept row survives the rollback
    sql = "SELECT label FROM ex19_keep ORDER BY 1"
    # => one call reads the survivor
    kept = Ecto.Adapters.SQL.query!(Ex19.Repo, sql, []).rows
    # => Output: kept: ada
    IO.puts("kept: " <> Enum.map_join(kept, ", ", fn [l] -> l end))
    # => the dropped table is really gone
    sql = "SELECT to_regclass('public.ex19_drop')"
    # => one call probes the dropped table
    [[gone]] = Ecto.Adapters.SQL.query!(Ex19.Repo, sql, []).rows
    # => Output: dropped: true
    IO.puts("dropped: #{gone == nil}")
    # => the survivor table drops outside the migrator
    Ecto.Adapters.SQL.query!(Ex19.Repo, "DROP TABLE ex19_keep", [])
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex19.Main.run()
