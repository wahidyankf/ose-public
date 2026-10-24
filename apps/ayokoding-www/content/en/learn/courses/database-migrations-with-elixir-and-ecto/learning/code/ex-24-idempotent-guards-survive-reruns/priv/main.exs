# => Example 24: Idempotent Guards Survive Reruns
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex24.Repo, migration_source: "ex24_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex24.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex24.Main do
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
    {:ok, _} = Ex24.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex24")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000124_make_guarded.exs"), ~S"""
    # => guards make the file safe to run twice
    defmodule Ex24.Repo.Migrations.MakeGuarded do
    # => create_if_not_exists skips the table when it exists
    use Ecto.Migration

    # => every call checks before acting
    def up do
    # => CREATE TABLE IF NOT EXISTS under the hood
    create_if_not_exists table(:ex24_guarded) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the guarded table lands once
    end
    # => end up: reruns stay green
    end
    # => DROP TABLE IF EXISTS under the hood
    def down do
    # => a missing table is not an error on the way down
    drop_if_exists table(:ex24_guarded)
    # => end down: guards both ways make reruns boring
    end
    # => end MakeGuarded: up, down, up, down all stay green
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex24.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex24.Repo, "DROP TABLE IF EXISTS ex24_guarded", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex24.Repo, scratch, :up, all: true, log: false)
    # => first down leaves no trace
    Ecto.Migrator.run(Ex24.Repo, scratch, :down, to: 0, log: false)
    # => the second cycle applies the same version again
    again = Ecto.Migrator.run(Ex24.Repo, scratch, :up, all: true, log: false)
    # => Output: again: [202601000124]
    IO.puts("again: #{inspect(again)}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex24.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex24.Main.run()
