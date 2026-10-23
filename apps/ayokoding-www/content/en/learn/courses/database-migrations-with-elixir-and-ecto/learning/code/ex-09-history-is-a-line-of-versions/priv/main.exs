# => Example 9: History Is a Line of Versions
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex09.Repo, migration_source: "ex09_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex09.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex09.Main do
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
    {:ok, _} = Ex09.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex09")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000109_make_alpha.exs"), ~S"""
    # => one file in an ordered line of three
    defmodule Ex09.Repo.Migrations.MakeAlpha do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => versions not names decide the running order
    def change do
    # => one table per file keeps the line readable
    create table(:ex09_alpha) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the table lands with its column
    end
    # => end change: down drops what up created
    end
    # => end MakeAlpha: this file is one step of the line
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000110_make_beta.exs"), ~S"""
    # => one file in an ordered line of three
    defmodule Ex09.Repo.Migrations.MakeBeta do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => versions not names decide the running order
    def change do
    # => one table per file keeps the line readable
    create table(:ex09_beta) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the table lands with its column
    end
    # => end change: down drops what up created
    end
    # => end MakeBeta: this file is one step of the line
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000111_make_gamma.exs"), ~S"""
    # => one file in an ordered line of three
    defmodule Ex09.Repo.Migrations.MakeGamma do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => versions not names decide the running order
    def change do
    # => one table per file keeps the line readable
    create table(:ex09_gamma) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the table lands with its column
    end
    # => end change: down drops what up created
    end
    # => end MakeGamma: this file is one step of the line
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex09.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex09.Repo, "DROP TABLE IF EXISTS ex09_alpha", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex09.Repo, "DROP TABLE IF EXISTS ex09_beta", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex09.Repo, "DROP TABLE IF EXISTS ex09_gamma", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex09.Repo, scratch, :up, all: true, log: false)
    # => the receipts land in version order
    # => the filter keeps other units' rows out of the transcript
    sql =
      "SELECT version FROM ex09_history WHERE version IN (202601000109, 202601000110, 202601000111) ORDER BY version"

    # => one call reads the whole history
    versions = Ecto.Adapters.SQL.query!(Ex09.Repo, sql, []).rows
    # => Output: versions: 202601000109, 202601000110, 202601000111
    IO.puts("versions: " <> Enum.map_join(versions, ", ", fn [v] -> "#{v}" end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex09.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex09.Main.run()
