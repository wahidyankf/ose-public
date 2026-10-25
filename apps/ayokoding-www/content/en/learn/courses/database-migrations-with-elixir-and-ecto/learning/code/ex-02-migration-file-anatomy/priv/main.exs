# => Example 2: Migration File Anatomy
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex02.Repo, migration_source: "ex02_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex02.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex02.Main do
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
    {:ok, _} = Ex02.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex02")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000102_add_price.exs"), ~S"""
    # => module name is free text; the version orders the file
    defmodule Ex02.Repo.Migrations.AddPrice do
    # => every migration file opens the same way
    use Ecto.Migration

    # => change covers both directions when every call reverses
    def change do
    # => CREATE TABLE with two content columns
    create table(:ex02_widgets) do
    # => what the widget is called
      add :name, :string
    # => what the widget costs, in cents
      add :price, :integer
    # => end create: both columns land in one statement
    end
    # => end change: the reverse drops the table
    end
    # => end AddPrice: filename and module describe the same change
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex02.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex02.Repo, "DROP TABLE IF EXISTS ex02_widgets", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex02.Repo, scratch, :up, all: true, log: false)
    # => history lists every file with its state
    [{status, version, name}] = Ecto.Migrator.migrations(Ex02.Repo, scratch)
    # => Output: status: up 202601000102 add_price
    IO.puts("status: #{status} #{version} #{name}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex02.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex02.Main.run()
