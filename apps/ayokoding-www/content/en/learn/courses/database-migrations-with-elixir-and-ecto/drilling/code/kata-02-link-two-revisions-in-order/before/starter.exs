# => Example 2: Link Two Revisions in Order
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata02.Repo, migration_source: "kata02_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata02.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata02.Main do
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
    {:ok, _} = Kata02.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata02")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000120_make_first.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata02.Repo.Migrations.MakeFirst do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata02_first) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end MakeFirst: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202602000121_make_second.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata02.Repo.Migrations.MakeSecond do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata02_second) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end MakeSecond: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata02.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata02.Repo, "DROP TABLE IF EXISTS kata02_first", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata02.Repo, "DROP TABLE IF EXISTS kata02_second", [])

    # => the starter runs only the first of two files
    Ecto.Migrator.run(Kata02.Repo, scratch, :up, to: 202_602_000_120, log: false)
    # => the second file waits, pending
    pending = Ecto.Migrator.migrations(Kata02.Repo, scratch)
    # => foreign rows belong to other units, never this transcript
    pending = Enum.reject(pending, fn {_, _, n} -> n == "** FILE NOT FOUND **" end)
    # => one line names the pending file
    IO.puts(Enum.map_join(pending, "\n", fn {s, v, n} -> "#{s} #{v} #{n}" end))

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata02.Main.run()
