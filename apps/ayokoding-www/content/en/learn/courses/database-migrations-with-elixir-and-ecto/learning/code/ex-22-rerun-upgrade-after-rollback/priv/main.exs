# => Example 22: Rerun Upgrade After Rollback
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex22.Repo, migration_source: "ex22_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex22.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex22.Main do
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
    {:ok, _} = Ex22.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex22")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000122_make_widgets.exs"), ~S"""
    # => one table to run up, down, and up again
    defmodule Ex22.Repo.Migrations.MakeWidgets do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes, up builds again
    def change do
    # => the table the rerun recreates byte for byte
    create table(:ex22_widgets) do
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
    Ecto.Migrator.run(Ex22.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex22.Repo, "DROP TABLE IF EXISTS ex22_widgets", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex22.Repo, scratch, :up, all: true, log: false)
    # => roll all the way back down
    Ecto.Migrator.run(Ex22.Repo, scratch, :down, to: 0, log: false)
    # => the rerun applies the same version again
    rerun = Ecto.Migrator.run(Ex22.Repo, scratch, :up, all: true, log: false)
    # => Output: rerun: [202601000122]
    IO.puts("rerun: #{inspect(rerun)}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex22.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex22.Main.run()
