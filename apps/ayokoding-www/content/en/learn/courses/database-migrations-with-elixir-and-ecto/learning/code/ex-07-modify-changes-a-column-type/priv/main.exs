# => Example 7: Modify Changes a Column Type
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex07.Repo, migration_source: "ex07_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex07.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex07.Main do
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
    {:ok, _} = Ex07.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex07")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000107_make_scores.exs"), ~S"""
    # => scores start as small integers
    defmodule Ex07.Repo.Migrations.MakeScores do
    # => modify later widens the column in place
    use Ecto.Migration

    # => the starting type is a deliberate underestimate
    def change do
    # => one integer column to outgrow
    create table(:ex07_scores) do
    # => 32-bit range, fine until it is not
      add :points, :integer
    # => end create: the narrow starting shape
    end
    # => end change: the next file widens this column
    end
    # => end MakeScores: the before picture
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000108_widen_points.exs"), ~S"""
    # => widening keeps every existing row
    defmodule Ex07.Repo.Migrations.WidenPoints do
    # => modify rewrites the column type
    use Ecto.Migration

    # => integer to bigint never loses a value
    def change do
    # => ALTER TABLE ALTER COLUMN under the hood
    alter table(:ex07_scores) do
    # => 64-bit range; Postgres rewrites the column
    # => from: pins the old type so down can reverse
      modify :points, :bigint, from: :integer
    # => end alter: down narrows back to integer
    end
    # => end change: up widens, down narrows
    end
    # => end WidenPoints: the after picture
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex07.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex07.Repo, "DROP TABLE IF EXISTS ex07_scores", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex07.Repo, scratch, :up, all: true, log: false)
    # => the catalog reports the live type
    sql = "SELECT data_type FROM information_schema.columns "
    # => the filter names the column
    sql = sql <> "WHERE table_name = 'ex07_scores' AND column_name = 'points'"
    # => one call runs the catalog probe
    [[dtype]] = Ecto.Adapters.SQL.query!(Ex07.Repo, sql, []).rows
    # => Output: points: bigint
    IO.puts("points: #{dtype}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex07.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex07.Main.run()
