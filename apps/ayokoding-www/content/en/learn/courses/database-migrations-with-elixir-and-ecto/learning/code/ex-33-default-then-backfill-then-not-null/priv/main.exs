# => Example 33: Default Then Backfill Then Not Null
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex33.Repo, migration_source: "ex33_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex33.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex33.Main do
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
    {:ok, _} = Ex33.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex33")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000133_add_email.exs"), ~S"""
    # => the column starts nullable for old rows
    defmodule Ex33.Repo.Migrations.AddEmail do
    # => table plus seeds arrive in the same file
    use Ecto.Migration

    # => first the table, then the nullable column
    def change do
    # => members with names, contact later
    create table(:ex33_members) do
    # => the display name every row carries
      add :name, :string
    # => end create: names without contact
    end
    # => two-arg execute keeps change reversible
    execute "INSERT INTO ex33_members (name) VALUES ('ada'), ('grace')", "DELETE FROM ex33_members"
    # => the nullable column lands beside the rows
    alter table(:ex33_members) do
    # => nullable: existing rows stay valid
      add :email, :string, null: true
    # => end alter: contact exists but optional
    end
    # => end change: shape, rows, and nullable column
    end
    # => end AddEmail: step one of three
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000134_fill_nulls.exs"), ~S"""
    # => the fill removes every NULL before the constraint
    defmodule Ex33.Repo.Migrations.FillNulls do
    # => explicit up and down for the data step
    use Ecto.Migration

    # => fill the gaps the nullable column allowed
    def up do
    # => derive every email from the names stored
    execute "UPDATE ex33_members SET email = lower(name) || '@example.dev' WHERE email IS NULL"
    # => end up: no NULL remains
    end

    # => down clears the derived fill
    def down do
    # => NULL every address the up wrote
    execute "UPDATE ex33_members SET email = NULL"
    # => end down: gaps restored
    end
    # => end FillNulls: step two of three
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000135_require_email.exs"), ~S"""
    # => the constraint lands only when no NULL remains
    defmodule Ex33.Repo.Migrations.RequireEmail do
    # => explicit up and down for the constraint
    use Ecto.Migration

    # => NOT NULL is safe because the fill ran first
    def up do
    # => the column turns strict inside a transaction
    alter table(:ex33_members) do
    # => Postgres validates the two filled rows at once
      modify :email, :string, null: false
    # => end alter: the constraint holds
    end
    # => end up: strict from here on
    end

    # => down relaxes the column back to nullable
    def down do
    # => the reverse of the strict step
    alter table(:ex33_members) do
    # => old rows may lack contact again
      modify :email, :string, null: true
    # => end alter: nullable restored
    end
    # => end down: strictness lifted
    end
    # => end RequireEmail: step three of three
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex33.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex33.Repo, "DROP TABLE IF EXISTS ex33_members", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex33.Repo, scratch, :up, all: true, log: false)
    # => the catalog reports the strict flag
    sql = "SELECT is_nullable FROM information_schema.columns"
    # => the filter names the strict column
    sql = sql <> " WHERE table_name = 'ex33_members' AND column_name = 'email'"
    # => one call reads the flag
    [[flag]] = Ecto.Adapters.SQL.query!(Ex33.Repo, sql, []).rows
    # => Output: nullable: NO
    IO.puts("nullable: #{flag}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex33.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex33.Main.run()
