# => Example 44: Same Migrations Every Environment
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex44.Repo, migration_source: "ex44_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex44.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex44.Main do
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
    {:ok, _} = Ex44.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex44")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000144_make_widgets.exs"), ~S"""
    # => the same files every environment runs
    defmodule Ex44.Repo.Migrations.MakeWidgets do
    # => promotion replays files, never edits them
    use Ecto.Migration

    # => one table every environment creates
    def change do
    # => the widget every environment stores
    create table(:ex44_widgets) do
    # => a single label column, enough to prove the run
      add :label, :string
    # => end create: the promotable shape
    end
    # => end change: down drops what up created
    end
    # => end MakeWidgets: the file environments share
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex44.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex44.Repo, "DROP TABLE IF EXISTS ex44_widgets", [])

    # => the first environment runs the file
    Ecto.Migrator.run(Ex44.Repo, scratch, :up, all: true, log: false)
    # => the second environment replays the same files
    replay = Ecto.Migrator.run(Ex44.Repo, scratch, :up, all: true, log: false)
    # => Output: replay: []
    IO.puts("replay: #{inspect(replay)}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex44.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex44.Main.run()
