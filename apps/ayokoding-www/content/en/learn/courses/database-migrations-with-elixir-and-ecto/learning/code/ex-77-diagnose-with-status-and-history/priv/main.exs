# => Example 77: Diagnose with Status and History
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex77.Repo, migration_source: "ex77_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex77.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex77.Main do
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
    {:ok, _} = Ex77.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex77")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000177_make_a.exs"), ~S"""
    # => the passing file applies before the bad one
    defmodule Ex77.Repo.Migrations.MakeA do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the passing file
    create table(:ex77_a) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the file that passes
    end
    # => end change: down drops what up created
    end
    # => end MakeA: the passing candidate
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000178_make_b.exs"), ~S"""
    # => the second passing file applies before the bad one
    defmodule Ex77.Repo.Migrations.MakeB do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the second file
    create table(:ex77_b) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the second file that passes
    end
    # => end change: down drops what up created
    end
    # => end MakeB: the second passing candidate
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000179_break_c.exs"), ~S"""
    # => the bad file fails after two files applied
    defmodule Ex77.Repo.Migrations.BreakC do
    # => explicit up and down for the broken file
    use Ecto.Migration

    # => the table lands, then the bad statement fires
    def up do
    # => CREATE TABLE inside the migration transaction
    create table(:ex77_c) do
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
    drop table(:ex77_c)
    # => end down: the table is gone
    end
    # => end BreakC: the failing candidate
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex77.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex77.Repo, "DROP TABLE IF EXISTS ex77_a", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex77.Repo, "DROP TABLE IF EXISTS ex77_b", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex77.Repo, "DROP TABLE IF EXISTS ex77_c", [])

    # => the run stops at the bad file, two files stay
    # => the attempt runs; rescue below names any failure
    outcome =
      try do
        # => two files apply before the bad one fires
        Ecto.Migrator.run(Ex77.Repo, scratch, :up, all: true, log: false)
        # => unreachable: the error above skips the rest of try
        :ran
        # => the failure surfaces as a database error
      rescue
        # => the struct names the failure without secrets
        e in Postgrex.Error ->
          # => the rescue reports the error struct
          {:raised, e.__struct__}
          # => end rescue: two files stay applied
      end

    # => Output: raised: Postgrex.Error
    IO.puts("raised: #{inspect(elem(outcome, 1))}")
    # => history lists every file with its state
    status = Ecto.Migrator.migrations(Ex77.Repo, scratch)
    # => foreign rows belong to other units, never this transcript
    status = Enum.reject(status, fn {_, _, n} -> n == "** FILE NOT FOUND **" end)
    # => one line per file: state, version, name
    IO.puts(Enum.map_join(status, "\n", fn {s, v, n} -> "#{s} #{v} #{n}" end))
    # => history holds the two files that passed
    sql = "SELECT count(*) FROM ex77_history"
    # => one call counts the applied files
    [[applied]] = Ecto.Adapters.SQL.query!(Ex77.Repo, sql, []).rows
    # => Output: applied: 2
    IO.puts("applied: #{applied}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex77.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex77.Main.run()
