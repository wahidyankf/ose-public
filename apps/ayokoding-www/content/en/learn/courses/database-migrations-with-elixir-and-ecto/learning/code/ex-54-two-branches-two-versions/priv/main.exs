# => Example 54: Two Branches Two Versions
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex54.Repo, migration_source: "ex54_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex54.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex54.Main do
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
    {:ok, _} = Ex54.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex54")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000154_branch_alpha.exs"), ~S"""
    # => branch alpha adds its own table
    defmodule Ex54.Repo.Migrations.BranchAlpha do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => alpha's table lands first by version
    def change do
    # => the table branch alpha owns
    create table(:ex54_alpha) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: alpha's table
    end
    # => end change: down drops what up created
    end
    # => end BranchAlpha: branch one of two
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000155_branch_beta.exs"), ~S"""
    # => branch beta adds its own table
    defmodule Ex54.Repo.Migrations.BranchBeta do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => beta's table lands second by version
    def change do
    # => the table branch beta owns
    create table(:ex54_beta) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: beta's table
    end
    # => end change: down drops what up created
    end
    # => end BranchBeta: branch two of two
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex54.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex54.Repo, "DROP TABLE IF EXISTS ex54_alpha", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex54.Repo, "DROP TABLE IF EXISTS ex54_beta", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex54.Repo, scratch, :up, all: true, log: false)
    # => two branches land in version order
    sql =
      "SELECT version FROM ex54_history WHERE version IN (202601000154, 202601000155) ORDER BY version"

    # => one call reads both receipts
    versions = Ecto.Adapters.SQL.query!(Ex54.Repo, sql, []).rows
    # => Output: merged: 202601000154, 202601000155
    IO.puts("merged: " <> Enum.map_join(versions, ", ", fn [v] -> "#{v}" end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex54.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex54.Main.run()
