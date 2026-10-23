# => Example 26: Backfill Fills the New Column
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex26.Repo, migration_source: "ex26_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex26.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex26.Main do
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
    {:ok, _} = Ex26.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex26")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000126_make_members.exs"), ~S"""
    # => members start with names but no email
    defmodule Ex26.Repo.Migrations.MakeMembers do
    # => the seed rows live in the same file
    use Ecto.Migration

    # => first the shape, then the rows
    def change do
    # => handle plus name, no contact column yet
    create table(:ex26_members) do
    # => the display name every row carries
      add :name, :string
    # => end create: names without contact
    end
    # => seed rows the backfill will complete
    # => execute takes its own reverse as a second string
    execute "INSERT INTO ex26_members (name) VALUES ('ada'), ('grace'), ('lin')", "DELETE FROM ex26_members"
    # => end change: shape plus seed in one version
    end
    # => end MakeMembers: the before picture
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000127_backfill_email.exs"), ~S"""
    # => the backfill completes rows the schema left blank
    defmodule Ex26.Repo.Migrations.BackfillEmail do
    # => data follows schema in its own version
    use Ecto.Migration

    # => add the column, then fill it, in one file
    def up do
    # => nullable first: old rows have no email yet
    alter table(:ex26_members) do
    # => the new contact column starts empty
      add :email, :string
    # => end alter: schema half of the backfill
    end
    # => derive every email from the names already stored
    execute "UPDATE ex26_members SET email = lower(name) || '@example.dev'"
    # => end up: schema plus data in version order
    end

    # => down clears the fill, then drops the column
    def down do
    # => NULL the fill first so the column drops cleanly
    execute "UPDATE ex26_members SET email = NULL"
    # => remove the column the up added
    alter table(:ex26_members) do
    # => the reverse of the schema half
      remove :email
    # => end alter: the column is gone
    end
    # => end down: data cleared, schema reverted
    end
    # => end BackfillEmail: explicit up and down
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex26.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex26.Repo, "DROP TABLE IF EXISTS ex26_members", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex26.Repo, scratch, :up, all: true, log: false)
    # => every seed row gained an address
    sql = "SELECT count(*) FROM ex26_members"
    # => the filter counts only filled rows
    sql = sql <> " WHERE email IS NOT NULL"
    # => one call counts the filled rows
    [[filled]] = Ecto.Adapters.SQL.query!(Ex26.Repo, sql, []).rows
    # => Output: filled: 3
    IO.puts("filled: #{filled}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex26.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex26.Main.run()
