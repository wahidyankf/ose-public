# => Example 68: Statement Timeout Bounds Locks
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex68.Repo, migration_source: "ex68_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex68.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex68.Main do
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
    {:ok, _} = Ex68.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex68")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000168_make_widgets.exs"), ~S"""
    # => the table the timeout demonstration guards
    defmodule Ex68.Repo.Migrations.MakeWidgets do
    # => each statement sets its own bound
    use Ecto.Migration

    # => the bound travels with the statement
    def up do
    # => fifty milliseconds: fail fast instead of queueing
    execute "SET LOCAL lock_timeout = '50ms'"
    # => the guarded statement runs under the bound
    create table(:ex68_widgets) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the bounded statement
    end
    # => end up: the table lands inside the bound
    end

    # => down drops the bounded table
    def down do
    # => the reverse of the guarded statement
    drop table(:ex68_widgets)
    # => end down: the table is gone
    end
    # => end MakeWidgets: the bounded migration
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex68.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex68.Repo, "DROP TABLE IF EXISTS ex68_widgets", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex68.Repo, scratch, :up, all: true, log: false)
    # => one connection holds the bound from SET to SHOW
    Ex68.Repo.checkout(fn ->
      # => fifty milliseconds: fail fast instead of queueing
      Ecto.Adapters.SQL.query!(Ex68.Repo, "SET lock_timeout = '50ms'", [])
      # => SHOW reports the live bound for this session
      sql = "SHOW lock_timeout"
      # => one call reads the bound
      [[bound]] = Ecto.Adapters.SQL.query!(Ex68.Repo, sql, []).rows
      # => Output: bound: 50ms
      IO.puts("bound: #{bound}")
      # => the session bound drops before the checkout returns
      Ecto.Adapters.SQL.query!(Ex68.Repo, "SET lock_timeout = '0'", [])
      # => end checkout: the bound never leaks to the pool
    end)

    # => reverse everything for the next run
    Ecto.Migrator.run(Ex68.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex68.Main.run()
