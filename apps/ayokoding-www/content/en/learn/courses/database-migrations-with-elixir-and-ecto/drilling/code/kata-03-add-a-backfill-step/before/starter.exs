# => Example 3: Add a Backfill Step
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata03.Repo, migration_source: "kata03_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata03.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata03.Main do
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
    {:ok, _} = Kata03.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata03")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000130_add_email.exs"), ~S"""
    # => the schema half without its backfill
    defmodule Kata03.Repo.Migrations.AddEmail do
    # => the starter stops here, rows stay empty
    use Ecto.Migration

    # => nullable email beside the seeded names
    def change do
    # => the roster every reader queries
    create table(:kata03_members) do
    # => the display name every row carries
      add :name, :string
    # => the contact column nobody fills yet
      add :email, :string
    # => end create: schema without data
    end
    # => two-arg execute keeps change reversible
    execute "INSERT INTO kata03_members (name) VALUES ('ada'), ('grace')", "DELETE FROM kata03_members"
    # => end change: shape plus seed, no backfill
    end
    # => end AddEmail: the incomplete starter
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata03.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata03.Repo, "DROP TABLE IF EXISTS kata03_members", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Kata03.Repo, scratch, :up, all: true, log: false)
    # => nobody filled the new column yet
    sql = "SELECT count(*) FROM kata03_members WHERE email IS NOT NULL"
    # => one call counts the empty fill
    [[filled]] = Ecto.Adapters.SQL.query!(Kata03.Repo, sql, []).rows
    # => Output: filled: 0
    IO.puts("filled: #{filled}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata03.Main.run()
