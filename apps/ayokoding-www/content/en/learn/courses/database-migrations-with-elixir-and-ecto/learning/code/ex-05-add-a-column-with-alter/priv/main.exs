# => Example 5: Add a Column with Alter
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex05.Repo, migration_source: "ex05_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex05.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex05.Main do
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
    {:ok, _} = Ex05.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex05")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000105_make_members.exs"), ~S"""
    # => first file: the table as first designed
    defmodule Ex05.Repo.Migrations.MakeMembers do
    # => two files, one ordered history
    use Ecto.Migration

    # => version 105 runs before version 106, always
    def change do
    # => members start with only a handle
    create table(:ex05_members) do
    # => the unique name members choose
      add :handle, :string
    # => end create: the starting shape
    end
    # => end change: the base the next file alters
    end
    # => end MakeMembers: history begins here
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000106_add_email.exs"), ~S"""
    # => second file: the table as redesigned
    defmodule Ex05.Repo.Migrations.AddEmail do
    # => alter runs inside the same transaction model
    use Ecto.Migration

    # => add inside alter appends a column reversibly
    def change do
    # => ALTER TABLE ADD COLUMN under the hood
    alter table(:ex05_members) do
    # => the new contact column, nullable for old rows
      add :email, :string
    # => end alter: down removes exactly this column
    end
    # => end change: up adds, down removes
    end
    # => end AddEmail: one file per schema step
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex05.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex05.Repo, "DROP TABLE IF EXISTS ex05_members", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex05.Repo, scratch, :up, all: true, log: false)
    # => both files contributed columns
    sql = "SELECT column_name FROM information_schema.columns "
    # => the filter names this unit's table
    sql = sql <> "WHERE table_name = 'ex05_members' ORDER BY ordinal_position"
    # => one call runs the catalog probe
    cols = Ecto.Adapters.SQL.query!(Ex05.Repo, sql, []).rows
    # => Output: columns: id, handle, email
    IO.puts("columns: " <> Enum.map_join(cols, ", ", fn [c] -> c end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex05.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex05.Main.run()
