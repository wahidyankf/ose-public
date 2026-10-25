# => Example 40: Swap Columns Without Downtime
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex40.Repo, migration_source: "ex40_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex40.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex40.Main do
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
    {:ok, _} = Ex40.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex40")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000140_wide_start.exs"), ~S"""
    # => the narrow column the swap will replace
    defmodule Ex40.Repo.Migrations.WideStart do
    # => seeds plus the column to outgrow
    use Ecto.Migration

    # => small integers that will overflow
    def change do
    # => the counters table every writer updates
    create table(:ex40_counters) do
    # => 32-bit range, fine until traffic grows
      add :hits, :integer
    # => end create: the narrow starting shape
    end
    # => two-arg execute keeps change reversible
    execute "INSERT INTO ex40_counters (hits) VALUES (7)", "DELETE FROM ex40_counters"
    # => end change: narrow shape plus one row
    end
    # => end WideStart: the before picture
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000141_swap_wide.exs"), ~S"""
    # => the swap adds wide, copies, and drops narrow
    defmodule Ex40.Repo.Migrations.SwapWide do
    # => explicit up and down for the swap
    use Ecto.Migration

    # => new column, copy, drop old: zero downtime
    def up do
    # => the wide successor beside the narrow original
    alter table(:ex40_counters) do
    # => 64-bit range for the traffic ahead
      add :hits_new, :bigint
    # => end alter: both columns coexist
    end
    # => every old value moves across untouched
    execute "UPDATE ex40_counters SET hits_new = hits"
    # => the narrow original leaves the table
    alter table(:ex40_counters) do
    # => DROP COLUMN under the hood
      remove :hits
    # => end alter: narrow is gone
    end
    # => the successor takes the original name
    rename table(:ex40_counters), :hits_new, to: :hits
    # => end up: wide column, original name
    end

    # => down swaps back the same way
    def down do
    # => the narrow column returns beside the wide one
    alter table(:ex40_counters) do
    # => 32-bit range, the old shape
      add :hits_old, :integer
    # => end alter: both columns coexist
    end
    # => every wide value moves back
    execute "UPDATE ex40_counters SET hits_old = hits"
    # => the wide column leaves the table
    alter table(:ex40_counters) do
    # => DROP COLUMN under the hood
      remove :hits
    # => end alter: wide is gone
    end
    # => the narrow column retakes its name
    rename table(:ex40_counters), :hits_old, to: :hits
    # => end down: narrow column, original name
    end
    # => end SwapWide: the zero-downtime widen
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex40.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex40.Repo, "DROP TABLE IF EXISTS ex40_counters", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex40.Repo, scratch, :up, all: true, log: false)
    # => the value survived the swap untouched
    sql = "SELECT hits FROM ex40_counters ORDER BY 1"
    # => one call reads the swapped value
    [[kept]] = Ecto.Adapters.SQL.query!(Ex40.Repo, sql, []).rows
    # => Output: kept: 7
    IO.puts("kept: #{kept}")
    # => the catalog reports the wide type
    sql = "SELECT data_type FROM information_schema.columns"
    # => the filter names the swapped column
    sql = sql <> " WHERE table_name = 'ex40_counters' AND column_name = 'hits'"
    # => one call reads the live type
    [[dtype]] = Ecto.Adapters.SQL.query!(Ex40.Repo, sql, []).rows
    # => Output: type: bigint
    IO.puts("type: #{dtype}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex40.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex40.Main.run()
