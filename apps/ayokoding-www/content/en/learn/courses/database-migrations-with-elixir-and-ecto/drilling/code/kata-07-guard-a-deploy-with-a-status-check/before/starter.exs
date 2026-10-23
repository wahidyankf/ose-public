# => Example 7: Guard a Deploy with a Status Check
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata07.Repo, migration_source: "kata07_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata07.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata07.Main do
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
    {:ok, _} = Kata07.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata07")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000170_make_a.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata07.Repo.Migrations.MakeA do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata07_a) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end MakeA: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202602000171_make_b.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata07.Repo.Migrations.MakeB do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata07_b) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end MakeB: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata07.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata07.Repo, "DROP TABLE IF EXISTS kata07_a", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata07.Repo, "DROP TABLE IF EXISTS kata07_b", [])

    # => the starter runs the first file without gating
    Ecto.Migrator.run(Kata07.Repo, scratch, :up, to: 202_602_000_170, log: false)
    # => the second file waits, pending and unguarded
    pending = Ecto.Migrator.migrations(Kata07.Repo, scratch)
    # => foreign rows belong to other units, never this transcript
    pending = Enum.reject(pending, fn {_, _, n} -> n == "** FILE NOT FOUND **" end)
    # => pending means down from this unit's side
    pending = Enum.filter(pending, fn {s, _, _} -> s == :down end)
    # => Output: pending: 202602000171 make_b
    IO.puts("pending: " <> Enum.map_join(pending, ", ", fn {_, v, n} -> "#{v} #{n}" end))

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata07.Main.run()
