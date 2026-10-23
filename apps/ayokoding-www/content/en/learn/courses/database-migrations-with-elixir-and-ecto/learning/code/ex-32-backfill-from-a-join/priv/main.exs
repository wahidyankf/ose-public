# => Example 32: Backfill from a Join
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex32.Repo, migration_source: "ex32_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex32.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex32.Main do
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
    {:ok, _} = Ex32.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex32")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000132_make_legacy.exs"), ~S"""
    # => the legacy table holds the source of truth
    defmodule Ex32.Repo.Migrations.MakeLegacy do
    # => handles join the two tables later
    use Ecto.Migration

    # => legacy handle plus the names to carry over
    def change do
    # => the old system's member roster
    create table(:ex32_legacy) do
    # => the join key both tables share
      add :handle, :string
    # => the display name to carry across
      add :name, :string
    # => end create: the source roster
    end
    # => two-arg execute keeps change reversible
    execute "INSERT INTO ex32_legacy (handle, name) VALUES ('a1', 'ada'), ('g1', 'grace')", "DELETE FROM ex32_legacy"
    # => end change: source shape plus rows
    end
    # => end MakeLegacy: the source of the backfill
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000133_make_members.exs"), ~S"""
    # => the new table starts with handles only
    defmodule Ex32.Repo.Migrations.MakeMembers do
    # => the join fills the names next
    use Ecto.Migration

    # => handle only, names arrive from legacy
    def change do
    # => the new roster every login reads
    create table(:ex32_members) do
    # => the join key carried over
      add :handle, :string
    # => filled by the join in the next version
      add :name, :string
    # => end create: handles without names
    end
    # => two-arg execute keeps change reversible
    execute "INSERT INTO ex32_members (handle) VALUES ('a1'), ('g1')", "DELETE FROM ex32_members"
    # => end change: handles waiting for names
    end
    # => end MakeMembers: the target of the backfill
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000134_fill_from_legacy.exs"), ~S"""
    # => the join carries names into the new table
    defmodule Ex32.Repo.Migrations.FillFromLegacy do
    # => explicit up and down for the join fill
    use Ecto.Migration

    # => UPDATE FROM joins the legacy roster
    def up do
    # => each handle gains its legacy name
    execute "UPDATE ex32_members m SET name = l.name FROM ex32_legacy l WHERE m.handle = l.handle"
    # => end up: names carried across
    end

    # => down clears the carried names
    def down do
    # => NULL every name the up wrote
    execute "UPDATE ex32_members SET name = NULL"
    # => end down: names cleared, handles stay
    end
    # => end FillFromLegacy: the join fill
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex32.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex32.Repo, "DROP TABLE IF EXISTS ex32_legacy", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex32.Repo, "DROP TABLE IF EXISTS ex32_members", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex32.Repo, scratch, :up, all: true, log: false)
    # => the join carried both names across
    sql = "SELECT name FROM ex32_members ORDER BY 1"
    # => one call reads the carried names
    names = Ecto.Adapters.SQL.query!(Ex32.Repo, sql, []).rows
    # => Output: names: ada, grace
    IO.puts("names: " <> Enum.map_join(names, ", ", fn [n] -> n end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex32.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex32.Main.run()
