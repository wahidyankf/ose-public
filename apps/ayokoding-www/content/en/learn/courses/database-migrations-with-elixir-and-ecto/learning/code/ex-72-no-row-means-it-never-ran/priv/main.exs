# => Example 72: No Row Means It Never Ran
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex72.Repo, migration_source: "ex72_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex72.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex72.Main do
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
    {:ok, _} = Ex72.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex72")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000171_break_widgets.exs"), ~S"""
    # => the table the failure will erase
    defmodule Ex72.Repo.Migrations.BreakWidgets do
    # => explicit up and down for the broken file
    use Ecto.Migration

    # => the table lands, then the bad statement fires
    def up do
    # => CREATE TABLE inside the migration transaction
    create table(:ex72_widgets) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the table the failure erases
    end
    # => no such function: the database rejects this
    execute "SELECT boom_missing_function()"
    # => end up: the failure the test catches
    end

    # => down drops the table when the file ever applies
    def down do
    # => the reverse of the created table
    drop table(:ex72_widgets)
    # => end down: the table is gone
    end
    # => end BreakWidgets: the failing file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex72.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex72.Repo, "DROP TABLE IF EXISTS ex72_widgets", [])

    # => the broken file raises through the migrator
    # => the attempt runs; rescue below names any failure
    outcome =
      try do
        # => the bad statement fires after the table lands
        Ecto.Migrator.run(Ex72.Repo, scratch, :up, all: true, log: false)
        # => unreachable: the error above skips the rest of try
        :ran
        # => the failure surfaces as a database error
      rescue
        # => the struct names the failure without secrets
        e in Postgrex.Error ->
          # => the rescue reports the error struct
          {:raised, e.__struct__}
          # => end rescue: the transaction rolled back
      end

    # => Output: raised: Postgrex.Error
    IO.puts("raised: #{inspect(elem(outcome, 1))}")
    # => the rolled-back file left no receipt
    sql = "SELECT count(*) FROM ex72_history WHERE version = 202601000171"
    # => one call counts the missing receipt
    [[kept]] = Ecto.Adapters.SQL.query!(Ex72.Repo, sql, []).rows
    # => Output: recorded: 0
    IO.puts("recorded: #{kept}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex72.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex72.Main.run()
