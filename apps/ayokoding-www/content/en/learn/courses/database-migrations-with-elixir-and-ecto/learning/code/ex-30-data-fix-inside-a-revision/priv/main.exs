# => Example 30: Data Fix Inside a Revision
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex30.Repo, migration_source: "ex30_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex30.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex30.Main do
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
    {:ok, _} = Ex30.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex30")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000130_make_members.exs"), ~S"""
    # => seed rows carry the mess real imports leave
    defmodule Ex30.Repo.Migrations.MakeMembers do
    # => the seed rows live in the same file
    use Ecto.Migration

    # => first the shape, then the messy rows
    def change do
    # => name plus email, both dirty on purpose
    create table(:ex30_members) do
    # => casing and padding vary like real imports
      add :name, :string
    # => end create: the messy starting shape
    end
    # => three rows with casing and padding faults
    # => execute takes its own reverse as a second string
    execute "INSERT INTO ex30_members (name) VALUES ('ADA'), ('grace '), (' LIN')", "DELETE FROM ex30_members"
    # => end change: shape plus dirty seed
    end
    # => end MakeMembers: the before picture
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000131_fix_names.exs"), ~S"""
    # => the data fix normalizes every stored name
    defmodule Ex30.Repo.Migrations.FixNames do
    # => explicit up and down for the data fix
    use Ecto.Migration

    # => trim padding, then fold case, in one statement
    def up do
    # => lower(trim()) repairs both faults at once
    execute "UPDATE ex30_members SET name = lower(trim(name))"
    # => end up: every name is clean
    end

    # => the fix cannot un-know the original mess
    def down do
    # => data fixes reverse to a no-op by team convention
    execute "SELECT 1"
    # => end down: the fix stays fixed
    end
    # => end FixNames: data fixes are one-way doors
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex30.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex30.Repo, "DROP TABLE IF EXISTS ex30_members", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex30.Repo, scratch, :up, all: true, log: false)
    # => both versions recorded, schema plus fix
    sql = "SELECT count(*) FROM ex30_members WHERE name = lower(trim(name))"
    # => one call counts the clean rows
    [[fixed]] = Ecto.Adapters.SQL.query!(Ex30.Repo, sql, []).rows
    # => Output: fixed: 3
    IO.puts("fixed: #{fixed}")
    # => the alphabetically first name proves the fold
    sql = "SELECT name FROM ex30_members ORDER BY 1 LIMIT 1"
    # => one call reads the sample
    [[sample]] = Ecto.Adapters.SQL.query!(Ex30.Repo, sql, []).rows
    # => Output: sample: ada
    IO.puts("sample: #{sample}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex30.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex30.Main.run()
