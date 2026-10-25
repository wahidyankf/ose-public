# => Example 39: Rename in Three Deployable Steps
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex39.Repo, migration_source: "ex39_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex39.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex39.Main do
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
    {:ok, _} = Ex39.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex39")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000139_expand.exs"), ~S"""
    # => step one adds the new column beside the old
    defmodule Ex39.Repo.Migrations.ExpandLogin do
    # => the rename starts as a plain addition
    use Ecto.Migration

    # => old column plus its successor, side by side
    def change do
    # => the roster every reader queries
    create table(:ex39_members) do
    # => the name the team wants to retire
      add :login, :string
    # => the name every reader will use
      add :handle, :string
    # => end create: old and new together
    end
    # => two-arg execute keeps change reversible
    execute "INSERT INTO ex39_members (login, handle) VALUES ('ada', NULL)", "DELETE FROM ex39_members"
    # => end change: expand lands with one stale row
    end
    # => end ExpandLogin: step one of three
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000140_migrate.exs"), ~S"""
    # => step two copies every old value across
    defmodule Ex39.Repo.Migrations.MigrateLogin do
    # => explicit up and down for the copy
    use Ecto.Migration

    # => copy old to new where new is still empty
    def up do
    # => the copy that lets readers move
    execute "UPDATE ex39_members SET handle = login WHERE handle IS NULL"
    # => end up: new matches old everywhere
    end

    # => down clears the copied values
    def down do
    # => NULL every value the up wrote
    execute "UPDATE ex39_members SET handle = NULL"
    # => end down: new is empty again
    end
    # => end MigrateLogin: step two of three
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000141_contract.exs"), ~S"""
    # => step three drops the retired column
    defmodule Ex39.Repo.Migrations.ContractLogin do
    # => readers moved, the old column may go
    use Ecto.Migration

    # => remove inside alter needs explicit directions
    def up do
    # => the retired column leaves the table
    alter table(:ex39_members) do
    # => DROP COLUMN under the hood
      remove :login
    # => end alter: old column gone
    end
    # => end up: contract complete
    end

    # => down restores the column and its values
    def down do
    # => the retired column returns beside the new
    alter table(:ex39_members) do
    # => nullable: the restore tolerates gaps
      add :login, :string, null: true
    # => end alter: old column back
    end
    # => copy the kept values back across
    execute "UPDATE ex39_members SET login = handle"
    # => end down: the rename walked back
    end
    # => end ContractLogin: step three of three
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex39.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex39.Repo, "DROP TABLE IF EXISTS ex39_members", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex39.Repo, scratch, :up, all: true, log: false)
    # => the rename completed across three versions
    sql = "SELECT version FROM ex39_history"
    # => this unit owns exactly three versions
    sql = sql <> " WHERE version IN (202601000139, 202601000140, 202601000141) ORDER BY version"
    # => one call reads every receipt
    versions = Ecto.Adapters.SQL.query!(Ex39.Repo, sql, []).rows
    # => Output: versions: 202601000139, 202601000140, 202601000141
    IO.puts("versions: " <> Enum.map_join(versions, ", ", fn [v] -> "#{v}" end))
    # => the renamed value survived all three steps
    sql = "SELECT handle FROM ex39_members ORDER BY 1"
    # => one call reads the renamed value
    [[kept]] = Ecto.Adapters.SQL.query!(Ex39.Repo, sql, []).rows
    # => Output: kept: ada
    IO.puts("kept: #{kept}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex39.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex39.Main.run()
