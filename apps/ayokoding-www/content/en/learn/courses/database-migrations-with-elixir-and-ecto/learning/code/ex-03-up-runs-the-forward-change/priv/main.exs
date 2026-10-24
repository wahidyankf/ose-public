# => Example 3: Up Runs the Forward Change
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex03.Repo, migration_source: "ex03_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex03.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex03.Main do
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
    {:ok, _} = Ex03.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex03")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000103_make_gadgets.exs"), ~S"""
    # => the forward change lives in change/0
    defmodule Ex03.Repo.Migrations.MakeGadgets do
    # => change/0 runs forward on up, backward on down
    use Ecto.Migration

    # => up creates, down drops, from this one block
    def change do
    # => the forward direction of this migration
    create table(:ex03_gadgets) do
    # => every gadget needs a stock code
      add :sku, :string, null: false
    # => end create: the forward change is one table
    end
    # => end change: the reverse is an automatic DROP TABLE
    end
    # => end MakeGadgets: up and down share this file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex03.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex03.Repo, "DROP TABLE IF EXISTS ex03_gadgets", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex03.Repo, scratch, :up, all: true, log: false)
    # => ordinal order keeps the print stable
    sql = "SELECT column_name FROM information_schema.columns "
    # => the filter names this unit's table
    sql = sql <> "WHERE table_name = 'ex03_gadgets' ORDER BY ordinal_position"
    # => one call runs the catalog probe
    cols = Ecto.Adapters.SQL.query!(Ex03.Repo, sql, []).rows
    # => Output: columns: id, sku
    IO.puts("columns: " <> Enum.map_join(cols, ", ", fn [c] -> c end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex03.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex03.Main.run()
