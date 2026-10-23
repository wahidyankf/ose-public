# => Example 1: First Migration Creates a Table
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex01.Repo, migration_source: "ex01_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex01.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex01.Main do
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
    {:ok, _} = Ex01.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex01")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000101_make_widgets.exs"), ~S"""
    # => one module per file, named after its content
    defmodule Ex01.Repo.Migrations.MakeWidgets do
    # => the DSL for create, alter, and friends
    use Ecto.Migration

    # => forward and reverse in one block for reversible calls
    def change do
    # => CREATE TABLE, recorded in history only on success
    create table(:ex01_widgets) do
    # => one text column beside the implicit id
      add :name, :string
    # => end create: the table shape is complete
    end
    # => end change: down reverses create into a drop
    end
    # => end MakeWidgets: the file is a complete migration
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex01.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex01.Repo, "DROP TABLE IF EXISTS ex01_widgets", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex01.Repo, scratch, :up, all: true, log: false)
    # => the catalog query in two short halves
    sql = "SELECT table_name FROM information_schema.tables "
    # => the filter names this unit's table
    sql = sql <> "WHERE table_name = 'ex01_widgets'"
    # => one call runs the catalog probe
    rows = Ecto.Adapters.SQL.query!(Ex01.Repo, sql, []).rows
    # => Output: tables: ex01_widgets
    IO.puts("tables: " <> Enum.map_join(rows, ", ", fn [t] -> t end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex01.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex01.Main.run()
