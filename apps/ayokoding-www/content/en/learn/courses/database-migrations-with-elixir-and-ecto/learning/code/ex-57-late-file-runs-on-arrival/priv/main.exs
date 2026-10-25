# => Example 57: Late File Runs on Arrival
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex57.Repo, migration_source: "ex57_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex57.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex57.Main do
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
    {:ok, _} = Ex57.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex57")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000157_make_head.exs"), ~S"""
    # => head lands first, alone
    defmodule Ex57.Repo.Migrations.MakeHead do
    # => the late file arrives after this one
    use Ecto.Migration

    # => head's table under the higher version
    def change do
    # => the table the head owns
    create table(:ex57_head) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the deployed head
    end
    # => end change: down drops what up created
    end
    # => end MakeHead: the applied head
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex57.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex57.Repo, "DROP TABLE IF EXISTS ex57_head", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex57.Repo, "DROP TABLE IF EXISTS ex57_late", [])

    # => head applies before the late file even arrives
    Ecto.Migrator.run(Ex57.Repo, scratch, :up, to: 202_601_000_157, log: false)
    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex57")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000155_make_late.exs"), ~S"""
    # => the late file carries the lower version
    defmodule Ex57.Repo.Migrations.MakeLate do
    # => pending means runnable, whatever its number
    use Ecto.Migration

    # => the late table lands when it arrives
    def change do
    # => the table the late branch owns
    create table(:ex57_late) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the late arrival
    end
    # => end change: down drops what up created
    end
    # => end MakeLate: the pending arrival
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => the late file runs on arrival, in version order
    late = Ecto.Migrator.run(Ex57.Repo, scratch, :up, all: true, log: false)
    # => Output: late: [202601000155]
    IO.puts("late: #{inspect(late)}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex57.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex57.Main.run()
