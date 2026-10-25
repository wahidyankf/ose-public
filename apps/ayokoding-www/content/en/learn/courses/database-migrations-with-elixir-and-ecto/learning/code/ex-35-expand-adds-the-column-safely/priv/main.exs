# => Example 35: Expand Adds the Column Safely
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex35.Repo, migration_source: "ex35_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex35.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex35.Main do
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
    {:ok, _} = Ex35.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex35")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000135_expand_members.exs"), ~S"""
    # => the expand step never breaks old readers
    defmodule Ex35.Repo.Migrations.ExpandMembers do
    # => seeds plus a nullable new column
    use Ecto.Migration

    # => old code ignores the column it cannot see
    def change do
    # => the table every reader already queries
    create table(:ex35_members) do
    # => the name old readers select
      add :name, :string
    # => end create: the deployed shape
    end
    # => two-arg execute keeps change reversible
    execute "INSERT INTO ex35_members (name) VALUES ('ada'), ('grace')", "DELETE FROM ex35_members"
    # => nullable: old writes stay valid
    alter table(:ex35_members) do
    # => the new contact column starts empty
      add :email, :string, null: true
    # => end alter: expand without breaking
    end
    # => end change: shape, rows, and room to grow
    end
    # => end ExpandMembers: the safe first step
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex35.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex35.Repo, "DROP TABLE IF EXISTS ex35_members", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex35.Repo, scratch, :up, all: true, log: false)
    # => old and new columns coexist
    sql = "SELECT column_name FROM information_schema.columns"
    # => the filter names this unit's table
    sql = sql <> " WHERE table_name = 'ex35_members' ORDER BY ordinal_position"
    # => one call reads the expanded shape
    cols = Ecto.Adapters.SQL.query!(Ex35.Repo, sql, []).rows
    # => Output: columns: id, name, email
    IO.puts("columns: " <> Enum.map_join(cols, ", ", fn [c] -> c end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex35.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex35.Main.run()
