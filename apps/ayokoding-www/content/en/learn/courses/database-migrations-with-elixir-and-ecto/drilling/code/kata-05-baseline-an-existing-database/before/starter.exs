# => Example 5: Baseline an Existing Database
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata05.Repo, migration_source: "kata05_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata05.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata05.Main do
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
    {:ok, _} = Kata05.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata05")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000150_baseline_ledger.exs"), ~S"""
    # => the file describes the legacy shape as code
    defmodule Kata05.Repo.Migrations.BaselineLedger do
    # => create_if_not_exists tolerates the legacy table
    use Ecto.Migration

    # => the legacy shape, versioned without rebuilding
    def change do
    # => IF NOT EXISTS: the legacy table stays untouched
    create_if_not_exists table(:kata05_ledger) do
    # => the handle every legacy row carries
      add :handle, :string
    # => end create: the adopted shape
    end
    # => end change: adopt, never rebuild
    end
    # => end BaselineLedger: the unmarked file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata05.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata05.Repo, "DROP TABLE IF EXISTS kata05_ledger", [])

    # => the legacy system built this table with rows
    sql = "CREATE TABLE kata05_ledger (id bigserial PRIMARY KEY, handle text)"
    # => one call builds the legacy shape
    Ecto.Adapters.SQL.query!(Kata05.Repo, sql, [])

    # => two legacy rows predate every migration
    sql = "INSERT INTO kata05_ledger (handle) VALUES ('ada'), ('grace')"
    # => one call adopts the legacy rows
    Ecto.Adapters.SQL.query!(Kata05.Repo, sql, [])

    # => nobody marked the baseline yet
    sql = "SELECT count(*) FROM kata05_history WHERE version = 202602000150"
    # => one call counts the missing mark
    [[marks]] = Ecto.Adapters.SQL.query!(Kata05.Repo, sql, []).rows
    # => Output: marks: 0
    IO.puts("marks: #{marks}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata05.Main.run()
