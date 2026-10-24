# => Example 6: Create an Index
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex06.Repo, migration_source: "ex06_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex06.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex06.Main do
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
    {:ok, _} = Ex06.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex06")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000106_make_products.exs"), ~S"""
    # => table first, index second, one file
    defmodule Ex06.Repo.Migrations.MakeProducts do
    # => create index/3 is a reversible call
    use Ecto.Migration

    # => both statements share one migration transaction
    def change do
    # => the table the index will cover
    create table(:ex06_products) do
    # => the column lookups filter on
      add :sku, :string
    # => end create: table exists before the index builds
    end

    # => CREATE INDEX for fast sku lookups
    create index(:ex06_products, [:sku])
    # => end change: down drops the index, then the table
    end
    # => end MakeProducts: index and table version together
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex06.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex06.Repo, "DROP TABLE IF EXISTS ex06_products", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex06.Repo, scratch, :up, all: true, log: false)
    # => pg_indexes lists every index on the table
    sql = "SELECT indexname FROM pg_indexes "
    # => the filter names this unit's table
    sql = sql <> "WHERE tablename = 'ex06_products' ORDER BY 1"
    # => one call runs the catalog probe
    idx = Ecto.Adapters.SQL.query!(Ex06.Repo, sql, []).rows
    # => Output: indexes: ex06_products_pkey, ex06_products_sku_index
    IO.puts("indexes: " <> Enum.map_join(idx, ", ", fn [i] -> i end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex06.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex06.Main.run()
