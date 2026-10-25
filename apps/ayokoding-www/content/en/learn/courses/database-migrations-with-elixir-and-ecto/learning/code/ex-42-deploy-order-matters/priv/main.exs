# => Example 42: Deploy Order Matters
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex42.Repo, migration_source: "ex42_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex42.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex42.Main do
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
    {:ok, _} = Ex42.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex42")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000142_make_members.exs"), ~S"""
    # => members start with names but no email
    defmodule Ex42.Repo.Migrations.MakeMembers do
    # => the seed rows live in the same file
    use Ecto.Migration

    # => first the shape, then the rows
    def change do
    # => name only, contact arrives next
    create table(:ex42_members) do
    # => the display name every row carries
      add :name, :string
    # => end create: names without contact
    end
    # => two-arg execute keeps change reversible
    execute "INSERT INTO ex42_members (name) VALUES ('ada'), ('grace')", "DELETE FROM ex42_members"
    # => end change: shape plus seed
    end
    # => end MakeMembers: the deployed base
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000143_add_email.exs"), ~S"""
    # => the column must land before any fill
    defmodule Ex42.Repo.Migrations.AddEmail do
    # => nullable first: deploys stay independent
    use Ecto.Migration

    # => the deployable step every later fill needs
    def change do
    # => ALTER TABLE ADD COLUMN under the hood
    alter table(:ex42_members) do
    # => existing rows stay valid mid-deploy
      add :email, :string, null: true
    # => end alter: column without data
    end
    # => end change: a safe intermediate deploy
    end
    # => end AddEmail: order matters, this runs first
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000144_fill_email.exs"), ~S"""
    # => the fill runs only after the column exists
    defmodule Ex42.Repo.Migrations.FillEmail do
    # => explicit up and down for the data step
    use Ecto.Migration

    # => derive every email from the names stored
    def up do
    # => the fill the intermediate deploy enabled
    execute "UPDATE ex42_members SET email = lower(name) || '@example.dev'"
    # => end up: column plus data, in order
    end

    # => down clears the fill the column keeps
    def down do
    # => NULL every address the up wrote
    execute "UPDATE ex42_members SET email = NULL"
    # => end down: data cleared, column stays
    end
    # => end FillEmail: order matters, this runs last
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex42.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex42.Repo, "DROP TABLE IF EXISTS ex42_members", [])

    # => the intermediate deploy runs only the first two
    Ecto.Migrator.run(Ex42.Repo, scratch, :up, to: 202_601_000_143, log: false)
    # => the column exists with no data yet
    sql = "SELECT count(*) FROM ex42_members WHERE email IS NOT NULL"
    # => one call counts the empty fill
    [[empty]] = Ecto.Adapters.SQL.query!(Ex42.Repo, sql, []).rows
    # => Output: intermediate filled: 0
    IO.puts("intermediate filled: #{empty}")
    # => the final deploy completes the order
    Ecto.Migrator.run(Ex42.Repo, scratch, :up, all: true, log: false)
    # => the fill ran after its column, in version order
    sql = "SELECT count(*) FROM ex42_members WHERE email IS NOT NULL"
    # => one call counts the completed fill
    [[done]] = Ecto.Adapters.SQL.query!(Ex42.Repo, sql, []).rows
    # => Output: final filled: 2
    IO.puts("final filled: #{done}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex42.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex42.Main.run()
