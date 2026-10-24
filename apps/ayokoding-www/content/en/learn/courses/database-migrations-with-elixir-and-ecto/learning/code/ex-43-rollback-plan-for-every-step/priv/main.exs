# => Example 43: Rollback Plan for Every Step
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex43.Repo, migration_source: "ex43_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex43.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex43.Main do
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
    {:ok, _} = Ex43.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex43")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000143_make_pair.exs"), ~S"""
    # => old and new columns start side by side
    defmodule Ex43.Repo.Migrations.MakePair do
    # => every step below carries its own reverse
    use Ecto.Migration

    # => the pair every step will evolve
    def change do
    # => the roster every reader queries
    create table(:ex43_members) do
    # => the old column the plan may restore
      add :handle, :string
    # => the new column the plan fills
      add :email, :string
    # => end create: old and new together
    end
    # => two-arg execute keeps change reversible
    execute "INSERT INTO ex43_members (handle) VALUES ('ada')", "DELETE FROM ex43_members"
    # => end change: the pair the plan protects
    end
    # => end MakePair: the rollback baseline
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000144_fill_and_drop.exs"), ~S"""
    # => the risky step with a written way back
    defmodule Ex43.Repo.Migrations.FillAndDrop do
    # => explicit up and down for the risky step
    use Ecto.Migration

    # => fill the new column, then drop the old
    def up do
    # => every old value moves across first
    execute "UPDATE ex43_members SET email = handle || '@example.dev'"
    # => the old column leaves only after the copy
    alter table(:ex43_members) do
    # => DROP COLUMN under the hood
      remove :handle
    # => end alter: old column gone
    end
    # => end up: the point of no return, planned
    end

    # => down restores the old column and its values
    def down do
    # => the old column returns beside the new
    alter table(:ex43_members) do
    # => nullable: the restore tolerates gaps
      add :handle, :string, null: true
    # => end alter: old column back
    end
    # => derive old values back from the new ones
    execute "UPDATE ex43_members SET handle = split_part(email, '@', 1)"
    # => end down: the plan walked back
    end
    # => end FillAndDrop: every step reversible
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex43.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex43.Repo, "DROP TABLE IF EXISTS ex43_members", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex43.Repo, scratch, :up, all: true, log: false)
    # => roll the risky step back, keep the baseline
    Ecto.Migrator.run(Ex43.Repo, scratch, :down, to: 202_601_000_144, log: false)
    # => the restored column serves readers again
    sql = "SELECT handle FROM ex43_members ORDER BY 1"
    # => one call reads the restored value
    [[restored]] = Ecto.Adapters.SQL.query!(Ex43.Repo, sql, []).rows
    # => Output: restored: ada
    IO.puts("restored: #{restored}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex43.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex43.Main.run()
