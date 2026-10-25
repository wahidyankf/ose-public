# => Example 1: Write a Revision and Its Rollback
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata01.Repo, migration_source: "kata01_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata01.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata01.Main do
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
    {:ok, _} = Kata01.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata01")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000110_make_widgets.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata01.Repo.Migrations.MakeWidgets do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata01_widgets) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end MakeWidgets: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata01.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata01.Repo, "DROP TABLE IF EXISTS kata01_widgets", [])

    # => the solution runs the full cycle
    Ecto.Migrator.run(Kata01.Repo, scratch, :up, all: true, log: false)
    # => down reverses the change the up made
    Ecto.Migrator.run(Kata01.Repo, scratch, :down, to: 0, log: false)
    # => the reversed table is really gone
    sql = "SELECT to_regclass('public.kata01_widgets')"
    # => one call proves the rollback worked
    [[gone]] = Ecto.Adapters.SQL.query!(Kata01.Repo, sql, []).rows
    # => Output: rolled back: true
    IO.puts("rolled back: #{gone == nil}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata01.Main.run()
