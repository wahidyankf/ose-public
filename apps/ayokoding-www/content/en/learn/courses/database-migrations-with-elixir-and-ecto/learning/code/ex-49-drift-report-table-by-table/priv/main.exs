# => Example 49: Drift Report Table by Table
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex49.Repo, migration_source: "ex49_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex49.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex49.Main do
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
    {:ok, _} = Ex49.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex49")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000149_make_pair.exs"), ~S"""
    # => two tables share one migration file
    defmodule Ex49.Repo.Migrations.MakePair do
    # => one file versions the pair together
    use Ecto.Migration

    # => both tables land in one transaction
    def change do
    # => the table that will stay clean
    create table(:ex49_clean) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the clean table
    end
    # => the table that will drift
    create table(:ex49_messy) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the table drift will touch
    end
    # => end change: the pair the report grades
    end
    # => end MakePair: one receipt for two tables
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex49.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex49.Repo, "DROP TABLE IF EXISTS ex49_clean", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex49.Repo, "DROP TABLE IF EXISTS ex49_messy", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex49.Repo, scratch, :up, all: true, log: false)
    # => drift lands on one table only, like a hotfix would
    Ecto.Adapters.SQL.query!(Ex49.Repo, "ALTER TABLE ex49_messy ADD COLUMN sneaky text", [])
    # => the report probes one table at a time
    sql = "SELECT table_name FROM information_schema.tables"
    # => the filter names this unit's pair
    sql = sql <> " WHERE table_name IN ('ex49_clean', 'ex49_messy') ORDER BY 1"
    # => one call lists the pair
    tables = Ecto.Adapters.SQL.query!(Ex49.Repo, sql, []).rows
    # => each table earns its own verdict line
    Enum.each(tables, fn [t] ->
      # => the catalog query names one table
      sql = "SELECT count(*) FROM information_schema.columns"
      # => the filter names the probed table and the known column
      sql = sql <> " WHERE table_name = '#{t}' AND column_name NOT IN ('id', 'label')"
      # => one call counts the unexpected columns
      [[extra]] = Ecto.Adapters.SQL.query!(Ex49.Repo, sql, []).rows
      # => clean tables print ok, drifted ones name the count
      IO.puts("#{t}: " <> if(extra == 0, do: "ok", else: "drift: #{extra} extra"))
      # => end each: the report covers the pair
    end)

    # => reverse everything for the next run
    Ecto.Migrator.run(Ex49.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex49.Main.run()
