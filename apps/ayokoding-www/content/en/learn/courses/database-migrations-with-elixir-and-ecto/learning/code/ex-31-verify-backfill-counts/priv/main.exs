# => Example 31: Verify Backfill Counts
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex31.Repo, migration_source: "ex31_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex31.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex31.Main do
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
    {:ok, _} = Ex31.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex31")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000131_make_orders.exs"), ~S"""
    # => four seed orders wait for verification
    defmodule Ex31.Repo.Migrations.MakeOrders do
    # => the seed rows live in the same file
    use Ecto.Migration

    # => first the shape, then the rows
    def change do
    # => total in cents, checked by the test
    create table(:ex31_orders) do
    # => the amount every row carries
      add :total, :integer
    # => end create: four rows, unchecked
    end
    # => two-arg execute keeps change reversible
    execute "INSERT INTO ex31_orders (total) VALUES (100), (200), (300), (400)", "DELETE FROM ex31_orders"
    # => end change: shape plus seed in one version
    end
    # => end MakeOrders: the before picture
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex31.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex31.Repo, "DROP TABLE IF EXISTS ex31_orders", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex31.Repo, scratch, :up, all: true, log: false)
    # => the expectation lives beside the probe
    expected = 4
    # => one call counts the migrated rows
    sql = "SELECT count(*) FROM ex31_orders"
    # => the filter names this unit's table
    [[actual]] = Ecto.Adapters.SQL.query!(Ex31.Repo, sql, []).rows
    # => Output: expected: 4, actual: 4, match: true
    IO.puts("expected: #{expected}, actual: #{actual}, match: #{expected == actual}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex31.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex31.Main.run()
