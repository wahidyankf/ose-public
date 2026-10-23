# => Example 73: Partial File Rolls Back Whole
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex73.Repo, migration_source: "ex73_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex73.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex73.Main do
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
    {:ok, _} = Ex73.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex73")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000173_make_pair.exs"), ~S"""
    # => two statements share one migration transaction
    defmodule Ex73.Repo.Migrations.MakePair do
    # => explicit up and down for the two-step file
    use Ecto.Migration

    # => first the table lands, then the bad statement fires
    def up do
    # => CREATE TABLE inside the migration transaction
    create table(:ex73_widgets) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the half the failure erases
    end
    # => a second table that never gets to land
    create table(:ex73_extra) do
    # => a single label column for the second table
      add :label, :string
    # => end create: the half the failure prevents
    end
    # => no such function: the database rejects this
    execute "SELECT boom_missing_function()"
    # => end up: the failure erases both halves
    end

    # => down drops both tables when the file ever applies
    def down do
    # => the reverse of the second table
    drop table(:ex73_extra)
    # => the reverse of the first table
    drop table(:ex73_widgets)
    # => end down: both tables gone
    end
    # => end MakePair: the partial file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex73.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex73.Repo, "DROP TABLE IF EXISTS ex73_widgets", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex73.Repo, "DROP TABLE IF EXISTS ex73_extra", [])

    # => the partial file raises through the migrator
    # => the attempt runs; rescue below names any failure
    outcome =
      try do
        # => two statements land before the bad one fires
        Ecto.Migrator.run(Ex73.Repo, scratch, :up, all: true, log: false)
        # => unreachable: the error above skips the rest of try
        :ran
        # => the failure surfaces as a database error
      rescue
        # => the struct names the failure without secrets
        e in Postgrex.Error ->
          # => the rescue reports the error struct
          {:raised, e.__struct__}
          # => end rescue: the transaction rolled back
      end

    # => Output: raised: Postgrex.Error
    IO.puts("raised: #{inspect(elem(outcome, 1))}")
    # => neither half of the partial file survived
    sql = "SELECT count(*) FROM information_schema.tables"
    # => the filter names this unit's pair
    sql = sql <> " WHERE table_name IN ('ex73_widgets', 'ex73_extra')"
    # => one call counts the surviving halves
    [[survived]] = Ecto.Adapters.SQL.query!(Ex73.Repo, sql, []).rows
    # => Output: survived: 0
    IO.puts("survived: #{survived}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex73.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex73.Main.run()
