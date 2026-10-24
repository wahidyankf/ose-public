# => Example 41: Constraint Not Valid First
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex41.Repo, migration_source: "ex41_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex41.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex41.Main do
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
    {:ok, _} = Ex41.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex41")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000141_make_orders.exs"), ~S"""
    # => totals must stay non-negative by policy
    defmodule Ex41.Repo.Migrations.MakeOrders do
    # => seeds plus an unchecked total column
    use Ecto.Migration

    # => the orders table every check will guard
    def change do
    # => totals in cents, negative forbidden later
    create table(:ex41_orders) do
    # => the amount the constraint will bound
      add :total, :integer
    # => end create: totals without a guard
    end
    # => two-arg execute keeps change reversible
    execute "INSERT INTO ex41_orders (total) VALUES (100), (200)", "DELETE FROM ex41_orders"
    # => end change: shape plus seed
    end
    # => end MakeOrders: the unguarded start
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000142_check_not_valid.exs"), ~S"""
    # => NOT VALID skips the table scan on busy tables
    defmodule Ex41.Repo.Migrations.CheckNotValid do
    # => explicit up and down for the guard
    use Ecto.Migration

    # => the guard lands without locking the table
    def up do
    # => new rows obey at once, old rows wait
    execute "ALTER TABLE ex41_orders ADD CONSTRAINT positive_total CHECK (total >= 0) NOT VALID"
    # => end up: guard present, old rows unchecked
    end

    # => down drops the guard by name
    def down do
    # => the reverse names the same constraint
    execute "ALTER TABLE ex41_orders DROP CONSTRAINT positive_total"
    # => end down: guard gone
    end
    # => end CheckNotValid: step one of two
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000143_validate_check.exs"), ~S"""
    # => VALIDATE scans old rows without blocking writes
    defmodule Ex41.Repo.Migrations.ValidateCheck do
    # => the second deploy finishes the guard
    use Ecto.Migration

    # => old rows face the guard in a later deploy
    def up do
    # => VALIDATE takes a light lock, writers continue
    execute "ALTER TABLE ex41_orders VALIDATE CONSTRAINT positive_total"
    # => end up: every row obeys the guard
    end

    # => down has nothing to undo: the guard stays
    def down do
    # => validation is a one-way scan by team convention
    execute "SELECT 1"
    # => end down: the guard stays validated
    end
    # => end ValidateCheck: step two of two
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex41.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex41.Repo, "DROP TABLE IF EXISTS ex41_orders", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex41.Repo, scratch, :up, all: true, log: false)
    # => pg_constraint reports the validated guard
    sql = "SELECT convalidated FROM pg_constraint"
    # => the filter names the guard
    sql = sql <> " WHERE conname = 'positive_total'"
    # => one call reads the validated flag
    [[valid]] = Ecto.Adapters.SQL.query!(Ex41.Repo, sql, []).rows
    # => Output: validated: true
    IO.puts("validated: #{valid}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex41.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex41.Main.run()
