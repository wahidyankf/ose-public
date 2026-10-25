# => Example 61: Down Then Up Replays Cleanly
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex61.Repo, migration_source: "ex61_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex61.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex61.Main do
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
    {:ok, _} = Ex61.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex61")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000161_make_widgets.exs"), ~S"""
    # => one table to run up, down, and up again
    defmodule Ex61.Repo.Migrations.MakeWidgets do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes, up builds again
    def change do
    # => the table the replay recreates byte for byte
    create table(:ex61_widgets) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the repeatable unit of work
    end
    # => end change: every direction derives from this block
    end
    # => end MakeWidgets: the file never changes between runs
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex61.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex61.Repo, "DROP TABLE IF EXISTS ex61_widgets", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex61.Repo, scratch, :up, all: true, log: false)
    # => roll all the way back down
    Ecto.Migrator.run(Ex61.Repo, scratch, :down, to: 0, log: false)
    # => the replay applies the same version again
    replay = Ecto.Migrator.run(Ex61.Repo, scratch, :up, all: true, log: false)
    # => Output: replay: [202601000161]
    IO.puts("replay: #{inspect(replay)}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex61.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex61.Main.run()
