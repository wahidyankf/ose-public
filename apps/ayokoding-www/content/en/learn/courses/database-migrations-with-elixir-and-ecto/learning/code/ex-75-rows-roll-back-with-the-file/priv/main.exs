# => Example 75: Rows Roll Back with the File
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex75.Repo, migration_source: "ex75_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex75.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex75.Main do
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
    {:ok, _} = Ex75.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex75")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000175_seed_then_fail.exs"), ~S"""
    # => rows land, then the bad statement fires
    defmodule Ex75.Repo.Migrations.SeedThenFail do
    # => explicit up and down for the broken seed
    use Ecto.Migration

    # => the rows land inside the migration transaction
    def up do
    # => the seed table the rows land in
    create table(:ex75_seeds) do
    # => the value every seed row carries
      add :value, :integer
    # => end create: the table the rollback erases
    end
    # => the rows the bad statement will erase
    execute "INSERT INTO ex75_seeds (value) VALUES (1), (2)"
    # => no such function: the database rejects this
    execute "SELECT boom_missing_function()"
    # => end up: the failure erases rows and table
    end

    # => down drops the table when the file ever applies
    def down do
    # => the reverse of the seed table
    drop table(:ex75_seeds)
    # => end down: the table is gone
    end
    # => end SeedThenFail: the broken seed
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex75.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex75.Repo, "DROP TABLE IF EXISTS ex75_seeds", [])

    # => the broken seed raises through the migrator
    # => the attempt runs; rescue below names any failure
    outcome =
      try do
        # => rows land before the bad statement fires
        Ecto.Migrator.run(Ex75.Repo, scratch, :up, all: true, log: false)
        # => unreachable: the error above skips the rest of try
        :ran
        # => the failure surfaces as a database error
      rescue
        # => the struct names the failure without secrets
        e in Postgrex.Error ->
          # => the rescue reports the error struct
          {:raised, e.__struct__}
          # => end rescue: rows and table rolled back
      end

    # => Output: raised: Postgrex.Error
    IO.puts("raised: #{inspect(elem(outcome, 1))}")
    # => the rolled-back rows are really gone
    sql = "SELECT to_regclass('public.ex75_seeds')"
    # => one call proves the table never landed
    [[gone]] = Ecto.Adapters.SQL.query!(Ex75.Repo, sql, []).rows
    # => Output: rows: 0
    IO.puts("rows: #{if(gone == nil, do: 0, else: -1)}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex75.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex75.Main.run()
