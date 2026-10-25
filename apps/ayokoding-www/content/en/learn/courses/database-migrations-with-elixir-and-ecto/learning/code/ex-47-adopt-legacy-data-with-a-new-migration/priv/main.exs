# => Example 47: Adopt Legacy Data with a New Migration
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex47.Repo, migration_source: "ex47_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex47.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex47.Main do
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
    {:ok, _} = Ex47.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex47")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000147_baseline_ledger.exs"), ~S"""
    # => the ledger predates the migration workflow
    defmodule Ex47.Repo.Migrations.BaselineLedger do
    # => create_if_not_exists tolerates the legacy table
    use Ecto.Migration

    # => the legacy shape, versioned without rebuilding
    def change do
    # => IF NOT EXISTS: the legacy table stays untouched
    create_if_not_exists table(:ex47_ledger) do
    # => the handle every legacy row carries
      add :handle, :string
    # => end create: the adopted shape
    end
    # => end change: adopt, never rebuild
    end
    # => end BaselineLedger: the starting receipt
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000148_add_status.exs"), ~S"""
    # => the new migration adopts legacy rows
    defmodule Ex47.Repo.Migrations.AddStatus do
    # => explicit up and down for the adoption
    use Ecto.Migration

    # => add the column, then fill it from legacy data
    def up do
    # => nullable first: adoption stays deployable
    alter table(:ex47_ledger) do
    # => the status column starts empty
      add :status, :string
    # => end alter: schema half of the adoption
    end
    # => legacy handles map to the active status
    execute "UPDATE ex47_ledger SET status = 'active' WHERE status IS NULL"
    # => end up: schema plus adopted data
    end

    # => down clears the adopted values
    def down do
    # => NULL every status the up wrote
    execute "UPDATE ex47_ledger SET status = NULL"
    # => remove the column the up added
    alter table(:ex47_ledger) do
    # => the reverse of the schema half
      remove :status
    # => end alter: the column is gone
    end
    # => end down: adoption reverted
    end
    # => end AddStatus: the adopting migration
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex47.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex47.Repo, "DROP TABLE IF EXISTS ex47_ledger", [])

    # => the legacy system built this table with rows
    sql = "CREATE TABLE ex47_ledger (id bigserial PRIMARY KEY, handle text)"
    # => one call builds the legacy shape
    Ecto.Adapters.SQL.query!(Ex47.Repo, sql, [])

    # => legacy rows predate every migration
    sql = "INSERT INTO ex47_ledger (handle) VALUES ('ada'), ('grace')"
    # => one call adopts the legacy rows
    Ecto.Adapters.SQL.query!(Ex47.Repo, sql, [])

    # => the baseline mark records the legacy shape
    sql = "INSERT INTO ex47_history (version) VALUES (202601000147)"
    # => one call writes the starting receipt
    Ecto.Adapters.SQL.query!(Ex47.Repo, sql, [])
    # => the adopting migration runs on legacy rows
    Ecto.Migrator.run(Ex47.Repo, scratch, :up, all: true, log: false)
    # => legacy rows gained the adopted status
    sql = "SELECT count(*) FROM ex47_ledger WHERE status = 'active'"
    # => one call counts the adopted rows
    [[adopted]] = Ecto.Adapters.SQL.query!(Ex47.Repo, sql, []).rows
    # => Output: adopted: 2
    IO.puts("adopted: #{adopted}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex47.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex47.Main.run()
