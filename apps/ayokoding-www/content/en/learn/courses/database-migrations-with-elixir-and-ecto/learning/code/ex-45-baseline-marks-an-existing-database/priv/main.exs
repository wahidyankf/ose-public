# => Example 45: Baseline Marks an Existing Database
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex45.Repo, migration_source: "ex45_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex45.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex45.Main do
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
    {:ok, _} = Ex45.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex45")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000145_baseline_members.exs"), ~S"""
    # => the file describes the legacy shape as code
    defmodule Ex45.Repo.Migrations.BaselineMembers do
    # => create_if_not_exists tolerates the legacy table
    use Ecto.Migration

    # => the legacy shape, versioned without rebuilding
    def change do
    # => IF NOT EXISTS: the legacy table stays untouched
    create_if_not_exists table(:ex45_members) do
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
    Ecto.Migrator.run(Ex45.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex45.Repo, "DROP TABLE IF EXISTS ex45_members", [])

    # => the legacy system built this table, not a migration
    sql = "CREATE TABLE ex45_members (id bigserial PRIMARY KEY, handle text)"
    # => one call builds the legacy shape
    Ecto.Adapters.SQL.query!(Ex45.Repo, sql, [])

    # => the baseline mark records the version by hand
    sql = "INSERT INTO ex45_history (version) VALUES (202601000145)"
    # => one call writes the starting receipt
    Ecto.Adapters.SQL.query!(Ex45.Repo, sql, [])
    # => history lists every file with its state
    status = Ecto.Migrator.migrations(Ex45.Repo, scratch)
    # => foreign rows belong to other units, never this transcript
    status = Enum.reject(status, fn {_, _, n} -> n == "** FILE NOT FOUND **" end)
    # => one line per file: state, version, name
    IO.puts(Enum.map_join(status, "\n", fn {s, v, n} -> "#{s} #{v} #{n}" end))
    # => down returns the database to unmarked
    Ecto.Migrator.run(Ex45.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex45.Main.run()
