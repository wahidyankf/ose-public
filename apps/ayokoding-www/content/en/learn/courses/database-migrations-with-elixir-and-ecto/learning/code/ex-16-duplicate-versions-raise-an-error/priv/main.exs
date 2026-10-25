# => Example 16: Duplicate Versions Raise an Error
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex16.Repo, migration_source: "ex16_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex16.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex16.Main do
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
    {:ok, _} = Ex16.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex16")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000118_make_one.exs"), ~S"""
    # => one file in an ordered line of three
    defmodule Ex16.Repo.Migrations.MakeOne do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => versions not names decide the running order
    def change do
    # => one table per file keeps the line readable
    create table(:ex16_one) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the table lands with its column
    end
    # => end change: down drops what up created
    end
    # => end MakeOne: this file is one step of the line
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000118_make_two.exs"), ~S"""
    # => one file in an ordered line of three
    defmodule Ex16.Repo.Migrations.MakeTwo do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => versions not names decide the running order
    def change do
    # => one table per file keeps the line readable
    create table(:ex16_two) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the table lands with its column
    end
    # => end change: down drops what up created
    end
    # => end MakeTwo: this file is one step of the line
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex16.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex16.Repo, "DROP TABLE IF EXISTS ex16_one", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex16.Repo, "DROP TABLE IF EXISTS ex16_two", [])

    # => two files claim one version: the migrator refuses
    # => the attempt runs; rescue below names any failure
    outcome =
      try do
        # => this call raises before touching the database
        Ecto.Migrator.run(Ex16.Repo, scratch, :up, all: true, log: false)
        # => unreachable: the error above skips the rest of try
        :ran
        # => only the migration conflict lands here
      rescue
        # => the struct names the failure without printing paths
        e in Ecto.MigrationError ->
          # => the rescue reports the error struct
          {:raised, e.__struct__}
          # => end rescue: the database never changed
      end

    # => Output: outcome: raised Ecto.MigrationError
    IO.puts("outcome: raised #{inspect(elem(outcome, 1))}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex16.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex16.Main.run()
