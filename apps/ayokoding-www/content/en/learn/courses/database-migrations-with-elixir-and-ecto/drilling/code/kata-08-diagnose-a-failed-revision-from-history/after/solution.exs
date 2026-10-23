# => Example 8: Diagnose a Failed Revision from History
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata08.Repo, migration_source: "kata08_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata08.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata08.Main do
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
    {:ok, _} = Kata08.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata08")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000180_make_good.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata08.Repo.Migrations.MakeGood do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata08_good) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end MakeGood: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202602000181_break_bad.exs"), ~S"""
    # => the bad file fails after the good one applied
    defmodule Kata08.Repo.Migrations.BreakBad do
    # => explicit up and down for the broken file
    use Ecto.Migration

    # => the table lands, then the bad statement fires
    def up do
    # => CREATE TABLE inside the migration transaction
    create table(:kata08_bad) do
    # => a single label column for the failing file
      add :label, :string
    # => end create: the table the failure erases
    end
    # => no such function: the database rejects this
    execute "SELECT boom_missing_function()"
    # => end up: the failure the diagnosis will name
    end

    # => down drops the table when the file ever applies
    def down do
    # => the reverse of the created table
    drop table(:kata08_bad)
    # => end down: the table is gone
    end
    # => end BreakBad: the failing candidate
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata08.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata08.Repo, "DROP TABLE IF EXISTS kata08_good", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata08.Repo, "DROP TABLE IF EXISTS kata08_bad", [])

    # => the diagnosis starts where the starter stopped
    # => the attempt runs; rescue below names any failure
    outcome =
      try do
        # => the good file applies before the bad one fires
        Ecto.Migrator.run(Kata08.Repo, scratch, :up, all: true, log: false)
        # => unreachable: the error above skips the rest of try
        :ran
        # => the failure surfaces as a database error
      rescue
        # => the struct names the failure without secrets
        e in Postgrex.Error ->
          # => the rescue reports the error struct
          {:raised, e.__struct__}
          # => end rescue: history names the failed file
      end

    # => Output: raised: Postgrex.Error
    IO.puts("raised: #{inspect(elem(outcome, 1))}")
    # => status names the file the error interrupted
    failed = Ecto.Migrator.migrations(Kata08.Repo, scratch)
    # => foreign rows belong to other units, never this diagnosis
    failed = Enum.reject(failed, fn {_, _, n} -> n == "** FILE NOT FOUND **" end)
    # => down from this unit's side means never applied
    failed = Enum.filter(failed, fn {s, _, _} -> s == :down end)
    # => Output: failed: 202602000181 break_bad
    IO.puts("failed: " <> Enum.map_join(failed, ", ", fn {_, v, n} -> "#{v} #{n}" end))
    # => the diagnosis rolls the partial run back
    Ecto.Migrator.run(Kata08.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata08.Main.run()
