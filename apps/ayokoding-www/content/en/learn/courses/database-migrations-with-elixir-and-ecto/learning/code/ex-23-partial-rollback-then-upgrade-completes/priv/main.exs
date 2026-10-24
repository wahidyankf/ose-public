# => Example 23: Partial Rollback Then Upgrade Completes
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex23.Repo, migration_source: "ex23_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex23.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex23.Main do
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
    {:ok, _} = Ex23.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex23")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000123_make_a.exs"), ~S"""
    # => first file of a three-file line
    defmodule Ex23.Repo.Migrations.MakeA do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => version 123 runs before 124 and 125
    create table(:ex23_a) do
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
    File.write!(Path.join(scratch, "202601000124_make_b.exs"), ~S"""
    # => second file of a three-file line
    defmodule Ex23.Repo.Migrations.MakeB do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => version 124 runs between 123 and 125
    create table(:ex23_b) do
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
    File.write!(Path.join(scratch, "202601000125_make_c.exs"), ~S"""
    # => third file of a three-file line
    defmodule Ex23.Repo.Migrations.MakeC do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => version 125 runs last of the three
    create table(:ex23_c) do
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
    Ecto.Migrator.run(Ex23.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex23.Repo, "DROP TABLE IF EXISTS ex23_a", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex23.Repo, "DROP TABLE IF EXISTS ex23_b", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex23.Repo, "DROP TABLE IF EXISTS ex23_c", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex23.Repo, scratch, :up, all: true, log: false)
    # => roll back only the last of three files
    Ecto.Migrator.run(Ex23.Repo, scratch, :down, to: 202_601_000_125, log: false)
    # => the upgrade completes from the partial history
    resumed = Ecto.Migrator.run(Ex23.Repo, scratch, :up, all: true, log: false)
    # => Output: resumed: [202601000125]
    IO.puts("resumed: #{inspect(resumed)}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex23.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex23.Main.run()
