# => Example 37: Migrate Reads to the New Column
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex37.Repo, migration_source: "ex37_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex37.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex37.Main do
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
    {:ok, _} = Ex37.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex37")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000137_move_reads.exs"), ~S"""
    # => the table whose readers move columns
    defmodule Ex37.Repo.Migrations.MoveReads do
    # => old column plus the new one readers want
    use Ecto.Migration

    # => both columns exist before any read moves
    def change do
    # => the roster every reader queries
    create table(:ex37_members) do
    # => the old column readers use today
      add :email, :string
    # => the new column readers will use
      add :email_new, :string
    # => end create: old and new side by side
    end
    # => two-arg execute keeps change reversible
    execute "INSERT INTO ex37_members (email, email_new) VALUES ('a@x.dev', NULL)", "DELETE FROM ex37_members"
    # => end change: one stale row to migrate
    end
    # => end MoveReads: the before picture
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000138_copy_reads.exs"), ~S"""
    # => the copy moves every old value across
    defmodule Ex37.Repo.Migrations.CopyReads do
    # => explicit up and down for the copy
    use Ecto.Migration

    # => copy old to new where new is still empty
    def up do
    # => the copy that lets readers move
    execute "UPDATE ex37_members SET email_new = email WHERE email_new IS NULL"
    # => end up: new matches old everywhere
    end

    # => down clears the copied values
    def down do
    # => NULL every value the up wrote
    execute "UPDATE ex37_members SET email_new = NULL"
    # => end down: new is empty again
    end
    # => end CopyReads: the migrate step
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex37.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex37.Repo, "DROP TABLE IF EXISTS ex37_members", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex37.Repo, scratch, :up, all: true, log: false)
    # => readers now use the new column only
    sql = "SELECT email_new FROM ex37_members ORDER BY 1"
    # => one call reads through the new column
    moved = Ecto.Adapters.SQL.query!(Ex37.Repo, sql, []).rows
    # => Output: moved: a@x.dev
    IO.puts("moved: " <> Enum.map_join(moved, ", ", fn [m] -> m end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex37.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex37.Main.run()
