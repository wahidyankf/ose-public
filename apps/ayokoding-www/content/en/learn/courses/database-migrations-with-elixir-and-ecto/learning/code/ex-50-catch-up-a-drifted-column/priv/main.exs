# => Example 50: Catch Up a Drifted Column
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex50.Repo, migration_source: "ex50_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex50.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex50.Main do
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
    {:ok, _} = Ex50.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex50")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000150_make_widgets.exs"), ~S"""
    # => the table the drift escapes
    defmodule Ex50.Repo.Migrations.MakeWidgets do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the forward change
    create table(:ex50_widgets) do
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

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000151_catch_up.exs"), ~S"""
    # => the catch-up documents the drifted column
    defmodule Ex50.Repo.Migrations.CatchUp do
    # => IF NOT EXISTS converges drifted and fresh databases
    use Ecto.Migration

    # => the catch-up runs clean on both shapes
    def up do
    # => drifted databases skip, fresh ones add
    execute "ALTER TABLE ex50_widgets ADD COLUMN IF NOT EXISTS nickname text", "ALTER TABLE ex50_widgets DROP COLUMN nickname"
    # => end up: the column exists everywhere now
    end

    # => down drops the documented column
    def down do
    # => the reverse names the same column
    execute "ALTER TABLE ex50_widgets DROP COLUMN nickname"
    # => end down: the column is gone
    end
    # => end CatchUp: drift converged
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex50.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex50.Repo, "DROP TABLE IF EXISTS ex50_widgets", [])

    # => the versioned shape lands before the drift
    Ecto.Migrator.run(Ex50.Repo, scratch, :up, to: 202_601_000_150, log: false)
    # => the drift lands outside the migrator, like a hotfix would
    Ecto.Adapters.SQL.query!(Ex50.Repo, "ALTER TABLE ex50_widgets ADD COLUMN nickname text", [])
    # => the catch-up converges both shapes
    Ecto.Migrator.run(Ex50.Repo, scratch, :up, all: true, log: false)
    # => the drifted column is versioned now
    sql = "SELECT column_name FROM information_schema.columns"
    # => the filter names this unit's table
    sql = sql <> " WHERE table_name = 'ex50_widgets' ORDER BY ordinal_position"
    # => one call reads the converged shape
    cols = Ecto.Adapters.SQL.query!(Ex50.Repo, sql, []).rows
    # => Output: columns: id, label, nickname
    IO.puts("columns: " <> Enum.map_join(cols, ", ", fn [c] -> c end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex50.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex50.Main.run()
