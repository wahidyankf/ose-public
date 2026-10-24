# => Example 59: Rebase onto Head
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex59.Repo, migration_source: "ex59_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex59.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex59.Main do
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
    {:ok, _} = Ex59.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex59")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000162_make_head.exs"), ~S"""
    # => head lands first, alone
    defmodule Ex59.Repo.Migrations.MakeHead do
    # => the rebase target the late file joins
    use Ecto.Migration

    # => head's table under the higher version
    def change do
    # => the table the head owns
    create table(:ex59_head) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the deployed head
    end
    # => end change: down drops what up created
    end
    # => end MakeHead: the applied head
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex59.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex59.Repo, "DROP TABLE IF EXISTS ex59_head", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex59.Repo, "DROP TABLE IF EXISTS ex59_rebased", [])

    # => head applies before the rebase lands
    Ecto.Migrator.run(Ex59.Repo, scratch, :up, to: 202_601_000_162, log: false)
    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex59")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000163_make_rebased.exs"), ~S"""
    # => the rebased file renumbers above head
    defmodule Ex59.Repo.Migrations.MakeRebased do
    # => rebase means retake a version past head
    use Ecto.Migration

    # => the rebased table lands last, on purpose
    def change do
    # => the table the rebased branch owns
    create table(:ex59_rebased) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the rebased arrival
    end
    # => end change: down drops what up created
    end
    # => end MakeRebased: the renumbered file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => the rebased file runs after head, by version
    rebased = Ecto.Migrator.run(Ex59.Repo, scratch, :up, all: true, log: false)
    # => Output: rebased: [202601000163]
    IO.puts("rebased: #{inspect(rebased)}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex59.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex59.Main.run()
