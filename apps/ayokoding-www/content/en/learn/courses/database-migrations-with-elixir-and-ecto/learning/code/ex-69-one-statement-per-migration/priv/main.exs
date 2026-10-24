# => Example 69: One Statement Per Migration
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex69.Repo, migration_source: "ex69_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex69.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex69.Main do
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
    {:ok, _} = Ex69.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex69")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000169_make_a.exs"), ~S"""
    # => first file of a three-file line
    defmodule Ex69.Repo.Migrations.MakeA do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => version 169 runs before 170 and 171
    create table(:ex69_a) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: first table of the line
    end
    # => end change: down drops what up created
    end
    # => end MakeA: file one of three
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000170_make_b.exs"), ~S"""
    # => second file of a three-file line
    defmodule Ex69.Repo.Migrations.MakeB do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => version 170 runs between 169 and 171
    create table(:ex69_b) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: second table of the line
    end
    # => end change: down drops what up created
    end
    # => end MakeB: file two of three
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000171_make_c.exs"), ~S"""
    # => third file of a three-file line
    defmodule Ex69.Repo.Migrations.MakeC do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => version 171 runs last of the three
    create table(:ex69_c) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: third table of the line
    end
    # => end change: down drops what up created
    end
    # => end MakeC: file three of three
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex69.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex69.Repo, "DROP TABLE IF EXISTS ex69_a", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex69.Repo, "DROP TABLE IF EXISTS ex69_b", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex69.Repo, "DROP TABLE IF EXISTS ex69_c", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex69.Repo, scratch, :up, all: true, log: false)
    # => three small files hold the line, one statement each
    sql = "SELECT version FROM ex69_history"
    # => this unit owns exactly three versions
    sql = sql <> " WHERE version IN (202601000169, 202601000170, 202601000171) ORDER BY version"
    # => one call reads every receipt
    versions = Ecto.Adapters.SQL.query!(Ex69.Repo, sql, []).rows
    # => Output: versions: 202601000169, 202601000170, 202601000171
    IO.puts("versions: " <> Enum.map_join(versions, ", ", fn [v] -> "#{v}" end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex69.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex69.Main.run()
