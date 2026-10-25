# => Example 63: Advisory Lock Primitive
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex63.Repo, migration_source: "ex63_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex63.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex63.Main do
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
    {:ok, _} = Ex63.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex63")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000163_make_widgets.exs"), ~S"""
    # => the table the lock demonstration holds
    defmodule Ex63.Repo.Migrations.MakeWidgets do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the forward change
    create table(:ex63_widgets) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the table the lock covers
    end
    # => end change: down drops what up created
    end
    # => end MakeWidgets: the locked table
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex63.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex63.Repo, "DROP TABLE IF EXISTS ex63_widgets", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex63.Repo, scratch, :up, all: true, log: false)
    # => checkout pins one connection for the whole block
    Ex63.Repo.checkout(fn ->
      # => first acquire on this session reports true
      # => take the advisory lock on the test key
      [[first]] =
        Ecto.Adapters.SQL.query!(Ex63.Repo, "SELECT pg_try_advisory_lock(6301)", []).rows

      # => Output: first: true
      IO.puts("first: #{first}")
      # => advisory locks re-enter on the same session
      # => take the advisory lock on the test key
      [[second]] =
        Ecto.Adapters.SQL.query!(Ex63.Repo, "SELECT pg_try_advisory_lock(6301)", []).rows

      # => Output: second: true
      IO.puts("second: #{second}")
      # => each acquire needs its own release
      [[u1]] = Ecto.Adapters.SQL.query!(Ex63.Repo, "SELECT pg_advisory_unlock(6301)", []).rows
      # => the last release frees the key
      [[u2]] = Ecto.Adapters.SQL.query!(Ex63.Repo, "SELECT pg_advisory_unlock(6301)", []).rows
      # => Output: unlocked: true
      IO.puts("unlocked: #{u1 and u2}")
      # => end checkout: the connection returns to the pool
    end)

    # => reverse everything for the next run
    Ecto.Migrator.run(Ex63.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex63.Main.run()
