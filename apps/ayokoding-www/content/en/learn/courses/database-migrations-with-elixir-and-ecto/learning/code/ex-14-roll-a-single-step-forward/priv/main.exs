# => Example 14: Roll a Single Step Forward
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex14.Repo, migration_source: "ex14_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex14.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex14.Main do
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
    {:ok, _} = Ex14.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex14")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000114_make_a.exs"), ~S"""
    # => one file in an ordered line of three
    defmodule Ex14.Repo.Migrations.MakeA do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => versions not names decide the running order
    def change do
    # => one table per file keeps the line readable
    create table(:ex14_a) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the table lands with its column
    end
    # => end change: down drops what up created
    end
    # => end MakeA: this file is one step of the line
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000115_make_b.exs"), ~S"""
    # => one file in an ordered line of three
    defmodule Ex14.Repo.Migrations.MakeB do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => versions not names decide the running order
    def change do
    # => one table per file keeps the line readable
    create table(:ex14_b) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the table lands with its column
    end
    # => end change: down drops what up created
    end
    # => end MakeB: this file is one step of the line
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000116_make_c.exs"), ~S"""
    # => one file in an ordered line of three
    defmodule Ex14.Repo.Migrations.MakeC do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => versions not names decide the running order
    def change do
    # => one table per file keeps the line readable
    create table(:ex14_c) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the table lands with its column
    end
    # => end change: down drops what up created
    end
    # => end MakeC: this file is one step of the line
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex14.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex14.Repo, "DROP TABLE IF EXISTS ex14_a", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex14.Repo, "DROP TABLE IF EXISTS ex14_b", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex14.Repo, "DROP TABLE IF EXISTS ex14_c", [])

    # => one step runs exactly one file and reports it
    first = Ecto.Migrator.run(Ex14.Repo, scratch, :up, step: 1, log: false)
    # => Output: first: [202601000114]
    IO.puts("first: #{inspect(first)}")
    # => the next step continues where the first stopped
    second = Ecto.Migrator.run(Ex14.Repo, scratch, :up, step: 1, log: false)
    # => Output: second: [202601000115]
    IO.puts("second: #{inspect(second)}")
    # => the last pending file runs with the usual all
    Ecto.Migrator.run(Ex14.Repo, scratch, :up, all: true, log: false)
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex14.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex14.Main.run()
