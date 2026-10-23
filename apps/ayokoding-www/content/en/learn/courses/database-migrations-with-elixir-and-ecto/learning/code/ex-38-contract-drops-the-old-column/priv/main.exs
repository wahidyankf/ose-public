# => Example 38: Contract Drops the Old Column
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex38.Repo, migration_source: "ex38_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex38.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex38.Main do
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
    {:ok, _} = Ex38.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex38")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000138_make_pair.exs"), ~S"""
    # => old and new columns start side by side
    defmodule Ex38.Repo.Migrations.MakePair do
    # => the contract step removes the old one
    use Ecto.Migration

    # => the pair the window maintained
    def change do
    # => the roster every reader queries
    create table(:ex38_members) do
    # => the old column readers left behind
      add :email, :string
    # => the new column every reader uses
      add :email_new, :string
    # => end create: old and new together
    end
    # => end change: the before picture
    end
    # => end MakePair: the expanded shape
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000139_drop_old.exs"), ~S"""
    # => the contract step drops the abandoned column
    defmodule Ex38.Repo.Migrations.DropOld do
    # => dropping loses data: down restores shape only
    use Ecto.Migration

    # => remove inside alter needs explicit directions
    def up do
    # => the column no reader selects
    alter table(:ex38_members) do
    # => DROP COLUMN under the hood
      remove :email
    # => end alter: old column gone
    end
    # => end up: contract complete
    end

    # => down brings the column back empty
    def down do
    # => the shape returns, the dropped values do not
    alter table(:ex38_members) do
    # => nullable: the restore tolerates the loss
      add :email, :string, null: true
    # => end alter: old column back, empty
    end
    # => end down: shape restored, data stays dropped
    end
    # => end DropOld: the safe last step
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex38.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex38.Repo, "DROP TABLE IF EXISTS ex38_members", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex38.Repo, scratch, :up, all: true, log: false)
    # => only the new column remains
    sql = "SELECT column_name FROM information_schema.columns"
    # => the filter names this unit's table
    sql = sql <> " WHERE table_name = 'ex38_members' ORDER BY ordinal_position"
    # => one call reads the contracted shape
    cols = Ecto.Adapters.SQL.query!(Ex38.Repo, sql, []).rows
    # => Output: columns: id, email_new
    IO.puts("columns: " <> Enum.map_join(cols, ", ", fn [c] -> c end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex38.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex38.Main.run()
