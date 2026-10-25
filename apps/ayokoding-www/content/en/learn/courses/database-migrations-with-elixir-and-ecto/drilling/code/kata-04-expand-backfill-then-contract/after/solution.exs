# => Example 4: Expand Backfill Then Contract
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata04.Repo, migration_source: "kata04_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata04.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata04.Main do
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
    {:ok, _} = Kata04.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata04")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000140_expand.exs"), ~S"""
    # => the starter expands without migrating or contracting
    defmodule Kata04.Repo.Migrations.ExpandHandles do
    # => old and new columns land together
    use Ecto.Migration

    # => both columns exist before any read moves
    def change do
    # => the roster every reader queries
    create table(:kata04_handles) do
    # => the old column readers use today
      add :email, :string
    # => the new column nobody reads yet
      add :email_new, :string
    # => end create: old and new side by side
    end
    # => two-arg execute keeps change reversible
    execute "INSERT INTO kata04_handles (email, email_new) VALUES ('a@x.dev', NULL)", "DELETE FROM kata04_handles"
    # => end change: expand without migrate or contract
    end
    # => end ExpandHandles: the incomplete starter
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202602000141_migrate.exs"), ~S"""
    # => the migrate step copies old values across
    defmodule Kata04.Repo.Migrations.MigrateReads do
    # => explicit up and down for the copy
    use Ecto.Migration

    # => copy old to new where new is still empty
    def up do
    # => the copy that lets readers move
    execute "UPDATE kata04_handles SET email_new = email WHERE email_new IS NULL"
    # => end up: new matches old everywhere
    end

    # => down clears the copied values
    def down do
    # => NULL every value the up wrote
    execute "UPDATE kata04_handles SET email_new = NULL"
    # => end down: new is empty again
    end
    # => end MigrateReads: the migrate step
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202602000142_contract.exs"), ~S"""
    # => the contract step drops the abandoned column
    defmodule Kata04.Repo.Migrations.ContractReads do
    # => readers moved, the old column may go
    use Ecto.Migration

    # => remove inside alter needs explicit directions
    def up do
    # => the column no reader selects
    alter table(:kata04_handles) do
    # => DROP COLUMN under the hood
      remove :email
    # => end alter: old column gone
    end
    # => end up: contract complete
    end

    # => down brings the column back empty
    def down do
    # => the shape returns, the dropped values do not
    alter table(:kata04_handles) do
    # => nullable: the restore tolerates the loss
      add :email, :string, null: true
    # => end alter: old column back, empty
    end
    # => end down: shape restored, data stays dropped
    end
    # => end ContractReads: the contract step
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata04.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata04.Repo, "DROP TABLE IF EXISTS kata04_handles", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Kata04.Repo, scratch, :up, all: true, log: false)
    # => the moved value survived all three steps
    sql = "SELECT email_new FROM kata04_handles ORDER BY 1"
    # => one call reads the contracted value
    [[kept]] = Ecto.Adapters.SQL.query!(Kata04.Repo, sql, []).rows
    # => Output: kept: a@x.dev
    IO.puts("kept: #{kept}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Kata04.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata04.Main.run()
