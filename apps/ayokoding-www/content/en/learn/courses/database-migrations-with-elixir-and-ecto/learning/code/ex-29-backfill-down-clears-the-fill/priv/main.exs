# => Example 29: Backfill Down Clears the Fill
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex29.Repo, migration_source: "ex29_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex29.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex29.Main do
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
    {:ok, _} = Ex29.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex29")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000129_make_members.exs"), ~S"""
    # => members start with names but no email
    defmodule Ex29.Repo.Migrations.MakeMembers do
    # => the seed rows live in the same file
    use Ecto.Migration

    # => first the shape, then the rows
    def change do
    # => name only, contact arrives later
    create table(:ex29_members) do
    # => the display name every row carries
      add :name, :string
    # => end create: names without contact
    end
    # => two seed rows the backfill will complete
    # => execute takes its own reverse as a second string
    execute "INSERT INTO ex29_members (name) VALUES ('ada'), ('grace')", "DELETE FROM ex29_members"
    # => end change: shape plus seed in one version
    end
    # => end MakeMembers: the before picture
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000130_add_email.exs"), ~S"""
    # => the data step with an explicit reverse
    defmodule Ex29.Repo.Migrations.AddEmail do
    # => explicit up and down for the data step
    use Ecto.Migration

    # => add the column, then fill it
    def up do
    # => nullable first: old rows have no email yet
    alter table(:ex29_members) do
    # => the new contact column starts empty
      add :email, :string
    # => end alter: schema half of the backfill
    end
    # => derive every email from the names already stored
    execute "UPDATE ex29_members SET email = lower(name) || '@example.dev'"
    # => end up: schema plus data in one version
    end

    # => the reverse clears the fill before dropping
    def down do
    # => NULL the fill so no reader sees half history
    execute "UPDATE ex29_members SET email = NULL"
    # => remove the column the up added
    alter table(:ex29_members) do
    # => the reverse of the schema half
      remove :email
    # => end alter: the column is gone
    end
    # => end down: data cleared, schema reverted
    end
    # => end AddEmail: both directions written out
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex29.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex29.Repo, "DROP TABLE IF EXISTS ex29_members", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex29.Repo, scratch, :up, all: true, log: false)
    # => both seed rows gained an address
    sql = "SELECT count(*) FROM ex29_members WHERE email IS NOT NULL"
    # => one call counts the filled rows
    [[filled]] = Ecto.Adapters.SQL.query!(Ex29.Repo, sql, []).rows
    # => Output: filled: 2
    IO.puts("filled: #{filled}")
    # => reverse only the data version, keep the table
    Ecto.Migrator.run(Ex29.Repo, scratch, :down, to: 202_601_000_130, log: false)
    # => the down cleared the fill before removing the column
    sql = "SELECT count(*) FROM information_schema.columns"
    # => the filter names the removed column
    sql = sql <> " WHERE table_name = 'ex29_members' AND column_name = 'email'"
    # => one call proves the column is gone
    [[gone]] = Ecto.Adapters.SQL.query!(Ex29.Repo, sql, []).rows
    # => Output: email gone: true
    IO.puts("email gone: #{gone == 0}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex29.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex29.Main.run()
