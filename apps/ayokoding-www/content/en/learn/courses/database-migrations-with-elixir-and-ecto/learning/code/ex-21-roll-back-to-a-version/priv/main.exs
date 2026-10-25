# => Example 21: Roll Back to a Version
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex21.Repo, migration_source: "ex21_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex21.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex21.Main do
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
    {:ok, _} = Ex21.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex21")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000121_make_a.exs"), ~S"""
    # => first file of a three-file line
    defmodule Ex21.Repo.Migrations.MakeA do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => version 121 runs before 122 and 123
    create table(:ex21_a) do
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
    File.write!(Path.join(scratch, "202601000122_make_b.exs"), ~S"""
    # => second file of a three-file line
    defmodule Ex21.Repo.Migrations.MakeB do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => version 122 runs between 121 and 123
    create table(:ex21_b) do
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
    File.write!(Path.join(scratch, "202601000123_make_c.exs"), ~S"""
    # => third file of a three-file line
    defmodule Ex21.Repo.Migrations.MakeC do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => version 123 runs last of the three
    create table(:ex21_c) do
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
    Ecto.Migrator.run(Ex21.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex21.Repo, "DROP TABLE IF EXISTS ex21_a", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex21.Repo, "DROP TABLE IF EXISTS ex21_b", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex21.Repo, "DROP TABLE IF EXISTS ex21_c", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex21.Repo, scratch, :up, all: true, log: false)
    # => down-to includes its target: this keeps only the first version
    Ecto.Migrator.run(Ex21.Repo, scratch, :down, to: 202_601_000_122, log: false)
    # => the receipts prove only the first version stayed
    # => the filter keeps other units' rows out of the transcript
    sql = "SELECT version FROM ex21_history WHERE version = 202601000121"
    # => one call reads the remaining row
    versions = Ecto.Adapters.SQL.query!(Ex21.Repo, sql, []).rows
    # => Output: kept: 202601000121
    IO.puts("kept: " <> Enum.map_join(versions, ", ", fn [v] -> "#{v}" end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex21.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex21.Main.run()
