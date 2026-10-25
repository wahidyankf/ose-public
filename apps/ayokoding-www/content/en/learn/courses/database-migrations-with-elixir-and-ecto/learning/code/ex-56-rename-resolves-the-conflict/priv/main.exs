# => Example 56: Rename Resolves the Conflict
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex56.Repo, migration_source: "ex56_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex56.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex56.Main do
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
    {:ok, _} = Ex56.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex56")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000155_branch_alpha.exs"), ~S"""
    # => alpha keeps the contested timestamp
    defmodule Ex56.Repo.Migrations.BranchAlpha do
    # => the rename gave beta its own version
    use Ecto.Migration

    # => alpha's table under the original version
    def change do
    # => the table branch alpha owns
    create table(:ex56_alpha) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: alpha's table
    end
    # => end change: down drops what up created
    end
    # => end BranchAlpha: the version's first owner
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000156_branch_beta.exs"), ~S"""
    # => beta takes the next version after the rename
    defmodule Ex56.Repo.Migrations.BranchBeta do
    # => one renamed file resolves the whole conflict
    use Ecto.Migration

    # => beta's table under the fresh version
    def change do
    # => the table branch beta owns
    create table(:ex56_beta) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: beta's table
    end
    # => end change: down drops what up created
    end
    # => end BranchBeta: the version's second owner
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex56.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex56.Repo, "DROP TABLE IF EXISTS ex56_alpha", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex56.Repo, "DROP TABLE IF EXISTS ex56_beta", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex56.Repo, scratch, :up, all: true, log: false)
    # => the renamed file runs after the original
    sql =
      "SELECT version FROM ex56_history WHERE version IN (202601000155, 202601000156) ORDER BY version"

    # => one call reads both receipts
    versions = Ecto.Adapters.SQL.query!(Ex56.Repo, sql, []).rows
    # => Output: resolved: 202601000155, 202601000156
    IO.puts("resolved: " <> Enum.map_join(versions, ", ", fn [v] -> "#{v}" end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex56.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex56.Main.run()
