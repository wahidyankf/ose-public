# => Example 58: Merge Keeps One History
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex58.Repo, migration_source: "ex58_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex58.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex58.Main do
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
    {:ok, _} = Ex58.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex58")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000158_branch_alpha.exs"), ~S"""
    # => alpha's table lands first by version
    defmodule Ex58.Repo.Migrations.BranchAlpha do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => alpha's table under the lower version
    def change do
    # => the table branch alpha owns
    create table(:ex58_alpha) do
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
    File.write!(Path.join(scratch, "202601000159_branch_beta.exs"), ~S"""
    # => beta's table lands second by version
    defmodule Ex58.Repo.Migrations.BranchBeta do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => beta's table under the higher version
    def change do
    # => the table branch beta owns
    create table(:ex58_beta) do
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

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000160_merge_marker.exs"), ~S"""
    # => the merge file closes the branch pair
    defmodule Ex58.Repo.Migrations.MergeMarker do
    # => one index both branches share after merging
    use Ecto.Migration

    # => the merge lands after both branches
    def change do
    # => every lookup by label stays fast
    create index(:ex58_alpha, [:label])
    # => end change: down drops the shared index
    end
    # => end MergeMarker: the merged line closes
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex58.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex58.Repo, "DROP TABLE IF EXISTS ex58_alpha", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex58.Repo, "DROP TABLE IF EXISTS ex58_beta", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex58.Repo, scratch, :up, all: true, log: false)
    # => history lists every file with its state
    status = Ecto.Migrator.migrations(Ex58.Repo, scratch)
    # => foreign rows belong to other units, never this transcript
    status = Enum.reject(status, fn {_, _, n} -> n == "** FILE NOT FOUND **" end)
    # => one line per file: state, version, name
    IO.puts(Enum.map_join(status, "\n", fn {s, v, n} -> "#{s} #{v} #{n}" end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex58.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex58.Main.run()
