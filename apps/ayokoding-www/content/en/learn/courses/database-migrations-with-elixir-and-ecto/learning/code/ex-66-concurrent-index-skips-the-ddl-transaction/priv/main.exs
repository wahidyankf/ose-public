# => Example 66: Concurrent Index Skips the DDL Transaction
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex66.Repo, migration_source: "ex66_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex66.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex66.Main do
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
    {:ok, _} = Ex66.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex66")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000166_make_members.exs"), ~S"""
    # => members start with names but no index
    defmodule Ex66.Repo.Migrations.MakeMembers do
    # => the seed rows live in the same file
    use Ecto.Migration

    # => first the shape, then the rows
    def change do
    # => handle plus name, lookups need an index
    create table(:ex66_members) do
    # => the display name every row carries
      add :name, :string
    # => end create: names without an index
    end
    # => two-arg execute keeps change reversible
    execute "INSERT INTO ex66_members (name) VALUES ('ada'), ('grace')", "DELETE FROM ex66_members"
    # => end change: shape plus seed
    end
    # => end MakeMembers: the before picture
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000167_index_members.exs"), ~S"""
    # => CONCURRENTLY cannot run inside a transaction
    defmodule Ex66.Repo.Migrations.IndexMembers do
    # => both flags lift the two blockers together
    use Ecto.Migration
    # => no DDL transaction: the index builds concurrently
    @disable_ddl_transaction true
    # => no migration lock: concurrent builds stay unlocked
    @disable_migration_lock true

    # => the online index for a busy table
    def change do
    # => writers continue while the index builds
    create index(:ex66_members, [:name], concurrently: true)
    # => end change: down drops the online index
    end
    # => end IndexMembers: the zero-downtime index
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex66.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex66.Repo, "DROP TABLE IF EXISTS ex66_members", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex66.Repo, scratch, :up, all: true, log: false)
    # => both the pkey and the online index exist
    sql = "SELECT indexname FROM pg_indexes"
    # => the filter names this unit's table
    sql = sql <> " WHERE tablename = 'ex66_members' ORDER BY 1"
    # => one call lists both indexes
    idx = Ecto.Adapters.SQL.query!(Ex66.Repo, sql, []).rows
    # => Output: indexes: ex66_members_name_index, ex66_members_pkey
    IO.puts("indexes: " <> Enum.map_join(idx, ", ", fn [i] -> i end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex66.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex66.Main.run()
