# => Example 28: Backfill in Batches
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex28.Repo, migration_source: "ex28_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex28.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex28.Main do
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
    {:ok, _} = Ex28.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex28")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000128_make_members.exs"), ~S"""
    # => five seed rows wait for batched fills
    defmodule Ex28.Repo.Migrations.MakeMembers do
    # => the seed rows live in the same file
    use Ecto.Migration

    # => first the shape, then the rows
    def change do
    # => name plus email, email starts empty
    create table(:ex28_members) do
    # => the display name every row carries
      add :name, :string
    # => the contact column the batches will fill
      add :email, :string
    # => end create: five rows, no addresses
    end
    # => five single-letter names keep the math visible
    # => execute takes its own reverse as a second string
    execute "INSERT INTO ex28_members (name) VALUES ('a'), ('b'), ('c'), ('d'), ('e')", "DELETE FROM ex28_members"
    # => end change: shape plus seed in one version
    end
    # => end MakeMembers: the before picture
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex28.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex28.Repo, "DROP TABLE IF EXISTS ex28_members", [])

    # => the schema migration runs first
    Ecto.Migrator.run(Ex28.Repo, scratch, :up, all: true, log: false)
    # => three offsets cover five rows in pairs
    offsets = [0, 2, 4]
    # => each batch fills at most two rows by id order
    Enum.each(offsets, fn off ->
      # => the batch window names its two rows
      sql = "UPDATE ex28_members SET email = lower(name) || '@example.dev'"
      # => id order plus limit plus offset bounds the batch
      sql = sql <> " WHERE id IN (SELECT id FROM ex28_members ORDER BY id LIMIT 2 OFFSET #{off})"
      # => one call fills the batch
      Ecto.Adapters.SQL.query!(Ex28.Repo, sql, [])
      # => end each: five rows filled in three batches
    end)

    # => every seed row gained an address
    sql = "SELECT count(*) FROM ex28_members WHERE email IS NOT NULL"
    # => one call counts the filled rows
    [[filled]] = Ecto.Adapters.SQL.query!(Ex28.Repo, sql, []).rows
    # => Output: batches: 3, filled: 5
    IO.puts("batches: #{length(offsets)}, filled: #{filled}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex28.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex28.Main.run()
