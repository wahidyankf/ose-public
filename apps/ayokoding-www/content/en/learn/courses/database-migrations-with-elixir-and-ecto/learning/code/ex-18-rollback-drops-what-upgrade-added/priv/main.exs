# => Example 18: Rollback Drops What Upgrade Added
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex18.Repo, migration_source: "ex18_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex18.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex18.Main do
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
    {:ok, _} = Ex18.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex18")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000118_make_things.exs"), ~S"""
    # => the forward change rollback will erase
    defmodule Ex18.Repo.Migrations.MakeThings do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the forward change
    create table(:ex18_things) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the table lands with its column
    end
    # => end change: down drops what up created
    end
    # => end MakeThings: rollback erases this file's work
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex18.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex18.Repo, "DROP TABLE IF EXISTS ex18_things", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex18.Repo, scratch, :up, all: true, log: false)
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex18.Repo, scratch, :down, to: 0, log: false)
    # => to_regclass returns one nil row for a dropped table
    sql = "SELECT to_regclass('public.ex18_things')"
    # => one call proves the table is gone
    [[gone]] = Ecto.Adapters.SQL.query!(Ex18.Repo, sql, []).rows
    # => Output: dropped: true
    IO.puts("dropped: #{gone == nil}")
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex18.Main.run()
