# => Example 8: Rename a Column Safely
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex08.Repo, migration_source: "ex08_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex08.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex08.Main do
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
    {:ok, _} = Ex08.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex08")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000109_make_articles.exs"), ~S"""
    # => the column name nobody likes
    defmodule Ex08.Repo.Migrations.MakeArticles do
    # => rename later fixes the name without copying data
    use Ecto.Migration

    # => start with the awkward name on purpose
    def change do
    # => one badly named column to fix
    create table(:ex08_articles) do
    # => the name the team regrets
      add :title, :string
    # => end create: the regrettable starting shape
    end
    # => end change: the next file renames this column
    end
    # => end MakeArticles: the before picture
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000110_rename_title.exs"), ~S"""
    # => rename keeps the data, changes the label
    defmodule Ex08.Repo.Migrations.RenameTitle do
    # => rename/3 is reversible: down renames back
    use Ecto.Migration

    # => RENAME COLUMN never touches a single value
    def change do
    # => the label changes, the data stays
    rename table(:ex08_articles), :title, to: :headline
    # => end change: one statement, fully reversed by down
    end
    # => end RenameTitle: the after picture
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex08.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex08.Repo, "DROP TABLE IF EXISTS ex08_articles", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex08.Repo, scratch, :up, all: true, log: false)
    # => the rename shows in the catalog
    sql = "SELECT column_name FROM information_schema.columns "
    # => the filter names this unit's table
    sql = sql <> "WHERE table_name = 'ex08_articles' ORDER BY ordinal_position"
    # => one call runs the catalog probe
    cols = Ecto.Adapters.SQL.query!(Ex08.Repo, sql, []).rows
    # => Output: columns: id, headline
    IO.puts("columns: " <> Enum.map_join(cols, ", ", fn [c] -> c end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex08.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex08.Main.run()
