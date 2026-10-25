# => Example 34: Split Schema and Data Revisions
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex34.Repo, migration_source: "ex34_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex34.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex34.Main do
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
    {:ok, _} = Ex34.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex34")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000134_make_orders.exs"), ~S"""
    # => the schema revision versions the shape
    defmodule Ex34.Repo.Migrations.MakeOrders do
    # => order totals in cents, no rows yet
    use Ecto.Migration

    # => the schema half of the split
    def change do
    # => the orders table every query reads
    create table(:ex34_orders) do
    # => the amount every order carries
      add :total, :integer
    # => end create: shape without data
    end
    # => end change: schema only, no backfill here
    end
    # => end MakeOrders: the schema revision
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000135_seed_orders.exs"), ~S"""
    # => the data revision versions the seed rows
    defmodule Ex34.Repo.Migrations.SeedOrders do
    # => explicit up and down for the seed step
    use Ecto.Migration

    # => seed rows land in their own version
    def up do
    # => two opening orders for the new table
    execute "INSERT INTO ex34_orders (total) VALUES (100), (200)"
    # => end up: rows readable from this version
    end

    # => down removes the seed rows
    def down do
    # => the table stays, only its seeds go
    execute "DELETE FROM ex34_orders"
    # => end down: shape without seeds
    end
    # => end SeedOrders: the data revision
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex34.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex34.Repo, "DROP TABLE IF EXISTS ex34_orders", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex34.Repo, scratch, :up, all: true, log: false)
    # => schema and data versions both recorded
    sql = "SELECT version FROM ex34_history"
    # => this unit owns exactly two versions
    sql = sql <> " WHERE version IN (202601000134, 202601000135) ORDER BY version"
    # => one call reads both receipts
    versions = Ecto.Adapters.SQL.query!(Ex34.Repo, sql, []).rows
    # => Output: versions: 202601000134, 202601000135
    IO.puts("versions: " <> Enum.map_join(versions, ", ", fn [v] -> "#{v}" end))
    # => the seed revision left two rows
    sql = "SELECT count(*) FROM ex34_orders"
    # => one call counts the seeds
    [[seeds]] = Ecto.Adapters.SQL.query!(Ex34.Repo, sql, []).rows
    # => Output: seeds: 2
    IO.puts("seeds: #{seeds}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex34.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex34.Main.run()
