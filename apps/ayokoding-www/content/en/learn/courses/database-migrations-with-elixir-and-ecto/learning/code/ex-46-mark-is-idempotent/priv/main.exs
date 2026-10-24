# => Example 46: Mark Is Idempotent
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex46.Repo, migration_source: "ex46_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex46.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex46.Main do
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
    {:ok, _} = Ex46.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex46")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000146_baseline_members.exs"), ~S"""
    # => the file describes the legacy shape as code
    defmodule Ex46.Repo.Migrations.BaselineMembers do
    # => create_if_not_exists tolerates the legacy table
    use Ecto.Migration

    # => the legacy shape, versioned without rebuilding
    def change do
    # => IF NOT EXISTS: the legacy table stays untouched
    create_if_not_exists table(:ex46_members) do
    # => the handle every legacy row carries
      add :handle, :string
    # => end create: the adopted shape
    end
    # => end change: adopt, never rebuild
    end
    # => end BaselineMembers: the starting receipt
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex46.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex46.Repo, "DROP TABLE IF EXISTS ex46_members", [])

    # => the legacy system built this table, not a migration
    sql = "CREATE TABLE ex46_members (id bigserial PRIMARY KEY, handle text)"
    # => one call builds the legacy shape
    Ecto.Adapters.SQL.query!(Ex46.Repo, sql, [])

    # => the mark lands once, whatever order operators run
    sql = "INSERT INTO ex46_history (version) VALUES (202601000146) ON CONFLICT DO NOTHING"
    # => one call writes the starting receipt
    Ecto.Adapters.SQL.query!(Ex46.Repo, sql, [])
    # => the second mark is a harmless no-op
    Ecto.Adapters.SQL.query!(Ex46.Repo, sql, [])
    # => one receipt, however many times operators mark
    sql = "SELECT count(*) FROM ex46_history WHERE version = 202601000146"
    # => one call counts the single receipt
    [[marks]] = Ecto.Adapters.SQL.query!(Ex46.Repo, sql, []).rows
    # => Output: marks: 1
    IO.puts("marks: #{marks}")
    # => down returns the database to unmarked
    Ecto.Migrator.run(Ex46.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex46.Main.run()
