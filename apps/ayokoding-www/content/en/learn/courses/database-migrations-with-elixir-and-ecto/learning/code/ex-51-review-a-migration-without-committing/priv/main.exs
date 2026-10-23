# => Example 51: Review a Migration Without Committing
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex51.Repo, migration_source: "ex51_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex51.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex51.Main do
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
    {:ok, _} = Ex51.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex51")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000151_make_widgets.exs"), ~S"""
    # => the table both candidates touch
    defmodule Ex51.Repo.Migrations.MakeWidgets do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the forward change
    create table(:ex51_widgets) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the safe candidate
    end
    # => end change: down drops what up created
    end
    # => end MakeWidgets: the candidate that passes
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202601000152_break_widgets.exs"), ~S"""
    # => the candidate with a broken statement
    defmodule Ex51.Repo.Migrations.BreakWidgets do
    # => the typo fails the review on purpose
    use Ecto.Migration

    # => the bad statement the review must catch
    def up do
    # => no such function: the database rejects this
    execute "SELECT boom_missing_function()"
    # => end up: the failure the review catches
    end

    # => down has nothing to undo
    def down do
    # => the broken up never committed anything
    execute "SELECT 1"
    # => end down: nothing to revert
    end
    # => end BreakWidgets: the candidate that fails
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex51.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex51.Repo, "DROP TABLE IF EXISTS ex51_widgets", [])

    # => the review job applies every candidate to a scratch state
    # => the attempt runs; rescue below names any failure
    reviewed =
      try do
        # => the broken candidate raises before reaching head
        Ecto.Migrator.run(Ex51.Repo, scratch, :up, all: true, log: false)
        # => unreachable when a candidate raises
        :clean
        # => the broken candidate raises through the review
      rescue
        # => the struct names the failure without secrets
        e in Postgrex.Error ->
          # => the rescue reports the error struct
          {:review_failed, e.__struct__}
          # => end rescue: the review fails the build here
      end

    # => Output: review: Postgrex.Error
    IO.puts("review: #{inspect(elem(reviewed, 1))}")
    # => the review rolls the partial run back
    Ecto.Migrator.run(Ex51.Repo, scratch, :down, to: 0, log: false)
    # => no receipt survived the reviewed run
    sql = "SELECT count(*) FROM ex51_history"
    # => one call proves the history stayed empty
    [[kept]] = Ecto.Adapters.SQL.query!(Ex51.Repo, sql, []).rows
    # => Output: applied: 0
    IO.puts("applied: #{kept}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex51.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex51.Main.run()
