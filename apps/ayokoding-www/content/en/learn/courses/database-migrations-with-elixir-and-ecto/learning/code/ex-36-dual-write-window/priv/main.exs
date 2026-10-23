# => Example 36: Dual Write Window
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex36.Repo, migration_source: "ex36_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex36.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex36.Main do
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
    {:ok, _} = Ex36.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex36")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000136_dual_write.exs"), ~S"""
    # => the table both writers share during the window
    defmodule Ex36.Repo.Migrations.DualWrite do
    # => old and new columns land together
    use Ecto.Migration

    # => writers fill both columns until readers move
    def change do
    # => the handle every writer stores
    create table(:ex36_handles) do
    # => the old contact column readers still use
      add :email, :string
    # => the new contact column readers will use
      add :email_new, :string
    # => end create: both columns from the start
    end
    # => end change: down drops the pair
    end
    # => end DualWrite: the window's table
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex36.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex36.Repo, "DROP TABLE IF EXISTS ex36_handles", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex36.Repo, scratch, :up, all: true, log: false)
    # => the application writes both columns at once
    sql = "INSERT INTO ex36_handles (email, email_new) VALUES ('a@x.dev', 'a@x.dev')"
    # => one call runs the dual write
    Ecto.Adapters.SQL.query!(Ex36.Repo, sql, [])

    # => readers may use either column during the window
    sql = "SELECT email, email_new FROM ex36_handles LIMIT 1"
    # => one call reads the dual-written row
    [[old, new]] = Ecto.Adapters.SQL.query!(Ex36.Repo, sql, []).rows
    # => Output: old: a@x.dev, new: a@x.dev
    IO.puts("old: #{old}, new: #{new}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex36.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex36.Main.run()
