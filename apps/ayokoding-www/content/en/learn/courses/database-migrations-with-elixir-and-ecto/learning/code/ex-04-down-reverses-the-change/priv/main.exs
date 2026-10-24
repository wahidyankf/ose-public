# => Example 4: Down Reverses the Change
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex04.Repo, migration_source: "ex04_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex04.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex04.Main do
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
    {:ok, _} = Ex04.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex04")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000104_make_orders.exs"), ~S"""
    # => down is the star of this example
    defmodule Ex04.Repo.Migrations.MakeOrders do
    # => the same file serves both directions
    use Ecto.Migration

    # => up builds, down removes, symmetric by construction
    def change do
    # => one table stands in for the forward change
    create table(:ex04_orders) do
    # => order total in cents
      add :total, :integer
    # => end create: the unit of work down will undo
    end
    # => end change: down derives DROP TABLE from create
    end
    # => end MakeOrders: nothing extra is needed for the reverse
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex04.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex04.Repo, "DROP TABLE IF EXISTS ex04_orders", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex04.Repo, scratch, :up, all: true, log: false)
    # => to_regclass names the table or returns one nil row
    # => the query stays readable on its own line
    sql = "SELECT to_regclass('public.ex04_orders')"
    # => one call runs the catalog probe
    [[up]] = Ecto.Adapters.SQL.query!(Ex04.Repo, sql, []).rows
    # => Output: present: true
    IO.puts("present: #{up != nil}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex04.Repo, scratch, :down, to: 0, log: false)
    # => same probe after the reversal
    # => the query stays readable on its own line
    sql = "SELECT to_regclass('public.ex04_orders')"
    # => one call runs the catalog probe
    [[down]] = Ecto.Adapters.SQL.query!(Ex04.Repo, sql, []).rows
    # => Output: present: false
    IO.puts("present: #{down != nil}")
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex04.Main.run()
