# => Example 27: Schema First Data Second
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex27.Repo, migration_source: "ex27_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex27.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex27.Main do
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
    {:ok, _} = Ex27.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex27")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000127_make_members.exs"), ~S"""
    # => members start with names but no email
    defmodule Ex27.Repo.Migrations.MakeMembers do
    # => the seed rows live in the same file
    use Ecto.Migration

    # => first the shape, then the rows
    def change do
    # => handle plus name, no contact column yet
    create table(:ex27_members) do
    # => the display name every row carries
      add :name, :string
    # => end create: names without contact
    end
    # => seed rows the backfill will complete
    # => execute takes its own reverse as a second string
    execute "INSERT INTO ex27_members (name) VALUES ('ada'), ('grace')", "DELETE FROM ex27_members"
    # => end change: shape plus seed in one version
    end
    # => end MakeMembers: the before picture
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000128_add_email.exs"), ~S"""
    # => schema lands before data, in its own file
    defmodule Ex27.Repo.Migrations.AddEmail do
    # => nullable first: old rows have no email yet
    use Ecto.Migration

    # => the schema half of the pair
    def change do
    # => ALTER TABLE ADD COLUMN under the hood
    alter table(:ex27_members) do
    # => the new contact column starts empty
      add :email, :string
    # => end alter: schema without data
    end
    # => end change: down removes exactly this column
    end
    # => end AddEmail: schema only, no backfill here
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000129_fill_email.exs"), ~S"""
    # => data follows schema in a second file
    defmodule Ex27.Repo.Migrations.FillEmail do
    # => explicit up and down for the data step
    use Ecto.Migration

    # => the data half of the pair
    def up do
    # => derive every email from the names already stored
    execute "UPDATE ex27_members SET email = lower(name) || '@example.dev'"
    # => end up: the fill runs after the schema
    end

    # => down clears the fill the up derived
    def down do
    # => NULL every address the up wrote
    execute "UPDATE ex27_members SET email = NULL"
    # => end down: data cleared, schema untouched
    end
    # => end FillEmail: data only, no schema here
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex27.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex27.Repo, "DROP TABLE IF EXISTS ex27_members", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex27.Repo, scratch, :up, all: true, log: false)
    # => schema and data versions all recorded
    sql = "SELECT version FROM ex27_history"
    # => this unit owns exactly three versions
    sql = sql <> " WHERE version IN (202601000127, 202601000128, 202601000129) ORDER BY version"
    # => one call reads every receipt
    versions = Ecto.Adapters.SQL.query!(Ex27.Repo, sql, []).rows
    # => Output: versions: 202601000127, 202601000128, 202601000129
    IO.puts("versions: " <> Enum.map_join(versions, ", ", fn [v] -> "#{v}" end))
    # => both seed rows gained an address
    sql = "SELECT count(*) FROM ex27_members WHERE email IS NOT NULL"
    # => one call counts the filled rows
    [[filled]] = Ecto.Adapters.SQL.query!(Ex27.Repo, sql, []).rows
    # => Output: filled: 2
    IO.puts("filled: #{filled}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex27.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex27.Main.run()
