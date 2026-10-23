# => Example 52: Guard a Deploy with a Status Check
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex52.Repo, migration_source: "ex52_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex52.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex52.Main do
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
    {:ok, _} = Ex52.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex52")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000152_make_a.exs"), ~S"""
    # => first file of a three-file line
    defmodule Ex52.Repo.Migrations.MakeA do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => version 152 runs before 153 and 154
    create table(:ex52_a) do
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
    File.write!(Path.join(scratch, "202601000153_make_b.exs"), ~S"""
    # => second file of a three-file line
    defmodule Ex52.Repo.Migrations.MakeB do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => version 153 runs between 152 and 154
    create table(:ex52_b) do
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
    File.write!(Path.join(scratch, "202601000154_make_c.exs"), ~S"""
    # => third file of a three-file line
    defmodule Ex52.Repo.Migrations.MakeC do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => version 154 runs last of the three
    create table(:ex52_c) do
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
    Ecto.Migrator.run(Ex52.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex52.Repo, "DROP TABLE IF EXISTS ex52_a", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex52.Repo, "DROP TABLE IF EXISTS ex52_b", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex52.Repo, "DROP TABLE IF EXISTS ex52_c", [])

    # => the deploy runs the first two files only
    Ecto.Migrator.run(Ex52.Repo, scratch, :up, to: 202_601_000_153, log: false)
    # => the guard lists files the history has not recorded
    pending = Ecto.Migrator.migrations(Ex52.Repo, scratch)
    # => foreign rows belong to other units, never this guard
    pending = Enum.reject(pending, fn {_, _, n} -> n == "** FILE NOT FOUND **" end)
    # => pending means down from this unit's side
    pending = Enum.filter(pending, fn {s, _, _} -> s == :down end)
    # => Output: pending: 202601000154 make_c
    IO.puts("pending: " <> Enum.map_join(pending, ", ", fn {_, v, n} -> "#{v} #{n}" end))
    # => the deploy completes the line
    Ecto.Migrator.run(Ex52.Repo, scratch, :up, all: true, log: false)
    # => the guard passes when nothing stays pending
    clear = Ecto.Migrator.migrations(Ex52.Repo, scratch)
    # => pending means down from this unit's side
    clear = Enum.filter(clear, fn {s, _, _} -> s == :down end)
    # => Output: pending: none
    IO.puts("pending: " <> if(clear == [], do: "none", else: "stuck"))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex52.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex52.Main.run()
