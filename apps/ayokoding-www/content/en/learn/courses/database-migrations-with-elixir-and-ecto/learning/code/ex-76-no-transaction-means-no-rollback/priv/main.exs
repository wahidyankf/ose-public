# => Example 76: No Transaction Means No Rollback
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex76.Repo, migration_source: "ex76_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex76.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex76.Main do
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
    {:ok, _} = Ex76.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex76")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000176_make_widgets.exs"), ~S"""
    # => the table the unguarded file leaves behind
    defmodule Ex76.Repo.Migrations.MakeWidgets do
    # => no transaction: statements commit one by one
    use Ecto.Migration
    # => without a transaction nothing rolls back
    @disable_ddl_transaction true

    # => the table commits before the bad statement fires
    def up do
    # => this CREATE commits at once, no transaction wraps it
    create table(:ex76_widgets) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: committed the moment it runs
    end
    # => no such function: the database rejects this
    execute "SELECT boom_missing_function()"
    # => end up: the failure keeps the committed table
    end

    # => down drops the table the failure left behind
    def down do
    # => the reverse of the created table
    drop table(:ex76_widgets)
    # => end down: the leftover is gone
    end
    # => end MakeWidgets: the unguarded file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex76.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex76.Repo, "DROP TABLE IF EXISTS ex76_widgets", [])

    # => the unguarded file raises through the migrator
    # => the attempt runs; rescue below names any failure
    outcome =
      try do
        # => the table commits before the bad statement fires
        Ecto.Migrator.run(Ex76.Repo, scratch, :up, all: true, log: false)
        # => unreachable: the error above skips the rest of try
        :ran
        # => the failure surfaces as a database error
      rescue
        # => the struct names the failure without secrets
        e in Postgrex.Error ->
          # => the rescue reports the error struct
          {:raised, e.__struct__}
          # => end rescue: the table stays, the version does not
      end

    # => Output: raised: Postgrex.Error
    IO.puts("raised: #{inspect(elem(outcome, 1))}")
    # => the committed table survives the failed file
    sql = "SELECT to_regclass('public.ex76_widgets')"
    # => one call probes the surviving table
    [[kept]] = Ecto.Adapters.SQL.query!(Ex76.Repo, sql, []).rows
    # => Output: table left behind: true
    IO.puts("table left behind: #{kept != nil}")
    # => the failed file left no receipt
    sql = "SELECT count(*) FROM ex76_history"
    # => one call proves the history stayed empty
    [[receipts]] = Ecto.Adapters.SQL.query!(Ex76.Repo, sql, []).rows
    # => Output: receipts: 0
    IO.puts("receipts: #{receipts}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex76.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex76.Main.run()
