# => Example 53: Record File Hashes
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex53.Repo, migration_source: "ex53_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex53.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex53.Main do
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
    {:ok, _} = Ex53.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex53")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000153_make_widgets.exs"), ~S"""
    # => the file the guard will fingerprint
    defmodule Ex53.Repo.Migrations.MakeWidgets do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the forward change
    create table(:ex53_widgets) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the fingerprinted file
    end
    # => end change: down drops what up created
    end
    # => end MakeWidgets: hashes guard this file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex53.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex53.Repo, "DROP TABLE IF EXISTS ex53_widgets", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex53.Repo, scratch, :up, all: true, log: false)
    # => the guard table lives outside the migrator
    sql = "CREATE TABLE ex53_hashes (path text PRIMARY KEY, sha text)"
    # => one call builds the hash registry
    Ecto.Adapters.SQL.query!(Ex53.Repo, sql, [])

    # => Ecto records no checksums, so the team fingerprints files itself
    path = Path.join(scratch, "202601000153_make_widgets.exs")
    # => :crypto hashes client-side over the exact file bytes
    sha = :crypto.hash(:sha256, File.read!(path)) |> Base.encode16(case: :lower)
    # => the guard stores the known-good fingerprint
    sql = "INSERT INTO ex53_hashes (path, sha) VALUES ('make_widgets', '#{sha}')"
    # => one call records the file hash
    Ecto.Adapters.SQL.query!(Ex53.Repo, sql, [])

    # => a second read must match the stored print
    later = :crypto.hash(:sha256, File.read!(path)) |> Base.encode16(case: :lower)
    # => Output: hash match: true
    IO.puts("hash match: #{later == sha}")
    # => the guard table drops outside the migrator
    Ecto.Adapters.SQL.query!(Ex53.Repo, "DROP TABLE ex53_hashes", [])
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex53.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex53.Main.run()
