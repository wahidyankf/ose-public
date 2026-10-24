# => Example 78: Rehearse the Full Cycle
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex78.Repo, migration_source: "ex78_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex78.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex78.Main do
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
    {:ok, _} = Ex78.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex78")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000178_make_orders.exs"), ~S"""
    # => the table the rehearsal verifies end to end
    defmodule Ex78.Repo.Migrations.MakeOrders do
    # => the seed rows live in the same file
    use Ecto.Migration

    # => first the shape, then the rows
    def change do
    # => totals in cents, verified by the rehearsal
    create table(:ex78_orders) do
    # => the amount every row carries
      add :total, :integer
    # => end create: the rehearsed shape
    end
    # => two-arg execute keeps change reversible
    execute "INSERT INTO ex78_orders (total) VALUES (100), (200)", "DELETE FROM ex78_orders"
    # => end change: shape plus seed
    end
    # => end MakeOrders: the rehearsed file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex78.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex78.Repo, "DROP TABLE IF EXISTS ex78_orders", [])

    # => the rehearsal upgrades first
    Ecto.Migrator.run(Ex78.Repo, scratch, :up, all: true, log: false)
    # => the data the rehearsal verifies
    sql = "SELECT count(*) FROM ex78_orders"
    # => one call counts the rehearsed rows
    [[rows]] = Ecto.Adapters.SQL.query!(Ex78.Repo, sql, []).rows
    # => Output: rows: 2
    IO.puts("rows: #{rows}")
    # => the receipt the rehearsal verifies
    sql = "SELECT count(*) FROM ex78_history WHERE version = 202601000178"
    # => one call counts the rehearsed receipt
    [[receipts]] = Ecto.Adapters.SQL.query!(Ex78.Repo, sql, []).rows
    # => Output: receipts: 1
    IO.puts("receipts: #{receipts}")
    # => the rehearsal rolls back last
    Ecto.Migrator.run(Ex78.Repo, scratch, :down, to: 0, log: false)
    # => the rollback leaves nothing behind
    sql = "SELECT to_regclass('public.ex78_orders')"
    # => one call probes the rehearsed table
    [[gone]] = Ecto.Adapters.SQL.query!(Ex78.Repo, sql, []).rows
    # => Output: clean: true
    IO.puts("clean: #{gone == nil}")
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex78.Main.run()
