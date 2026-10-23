# => Example 17: Reorder by Renaming the Version
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex17.Repo, migration_source: "ex17_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex17.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex17.Main do
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
    {:ok, _} = Ex17.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex17")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000119_make_one.exs"), ~S"""
    # => one file in an ordered line of three
    defmodule Ex17.Repo.Migrations.MakeOne do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => versions not names decide the running order
    def change do
    # => one table per file keeps the line readable
    create table(:ex17_one) do
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
    File.write!(Path.join(scratch, "202601000120_make_two.exs"), ~S"""
    # => one file in an ordered line of three
    defmodule Ex17.Repo.Migrations.MakeTwo do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => versions not names decide the running order
    def change do
    # => one table per file keeps the line readable
    create table(:ex17_two) do
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
    Ecto.Migrator.run(Ex17.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex17.Repo, "DROP TABLE IF EXISTS ex17_one", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex17.Repo, "DROP TABLE IF EXISTS ex17_two", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex17.Repo, scratch, :up, all: true, log: false)
    # => distinct versions run oldest-first, conflict resolved
    names = Ecto.Migrator.migrations(Ex17.Repo, scratch)
    # => one line per file in running order
    IO.puts(Enum.map_join(names, "\n", fn {s, v, n} -> "#{s} #{v} #{n}" end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex17.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex17.Main.run()
