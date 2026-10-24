# => Example 70: Blocked Lock Attempts Raise Fast
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex70.Repo, migration_source: "ex70_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex70.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex70.Main do
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
    {:ok, _} = Ex70.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex70")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000170_make_widgets.exs"), ~S"""
    # => the table the blocked attempt wants
    defmodule Ex70.Repo.Migrations.MakeWidgets do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the forward change
    create table(:ex70_widgets) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the contested table
    end
    # => end change: down drops what up created
    end
    # => end MakeWidgets: the contested table
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex70.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex70.Repo, "DROP TABLE IF EXISTS ex70_widgets", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex70.Repo, scratch, :up, all: true, log: false)
    # => the holder pins one connection and locks the table
    me = self()
    # => the holder task owns the table lock
    # => the task runs on its own process and connection
    holder =
      Task.async(fn ->
        # => checkout pins the holder to a single connection
        Ex70.Repo.checkout(fn ->
          # => the transaction holds ACCESS EXCLUSIVE for the demo
          Ex70.Repo.transaction(fn ->
            # => this lock blocks every writer until release
            sql = "LOCK TABLE ex70_widgets IN ACCESS EXCLUSIVE MODE"
            # => one call takes the exclusive lock
            Ecto.Adapters.SQL.query!(Ex70.Repo, sql, [])

            # => signal the script only after the lock is held
            send(me, :locked)
            # => wait for the release signal before committing
            receive do
              # => the release signal frees the waiter
              :release ->
                # => the clause body acknowledges the signal
                :ok
                # => end receive: the signal was consumed
            end

            # => end transaction: commit releases the lock
          end)

          # => end checkout: the holder returns its connection
        end)

        # => end holder: the task exits cleanly after release
      end)

    # => wait until the holder owns the lock
    receive do
      # => the locked signal confirms the hold
      :locked ->
        # => the clause body acknowledges the signal
        :ok
        # => end receive: the signal was consumed
    end

    # => the bounded attempt refuses to queue behind the holder
    Ex70.Repo.checkout(fn ->
      # => fifty milliseconds: fail fast instead of queueing
      Ecto.Adapters.SQL.query!(Ex70.Repo, "SET lock_timeout = '50ms'", [])
      # => this statement cannot proceed while the holder locks
      # => the attempt runs; rescue below names any failure
      outcome =
        try do
          # => one connection carries the bound to the blocked statement
          sql = "LOCK TABLE ex70_widgets IN ACCESS EXCLUSIVE MODE"
          # => one call takes the exclusive lock
          Ecto.Adapters.SQL.query!(Ex70.Repo, sql, [])

          # => unreachable: the bound above fires first
          :queued
          # => the timeout surfaces as a database error
        rescue
          # => the struct names the failure without secrets
          e in Postgrex.Error ->
            # => the rescue reports the error struct
            {:blocked, e.__struct__}
            # => end rescue: the attempt failed fast
        end

      # => Output: blocked: Postgrex.Error
      IO.puts("blocked: #{inspect(elem(outcome, 1))}")
      # => the session bound drops before the checkout returns
      Ecto.Adapters.SQL.query!(Ex70.Repo, "SET lock_timeout = '0'", [])
      # => end checkout: the bound never leaks to the pool
    end)

    # => release the holder and wait for a clean exit
    send(holder.pid, :release)
    # => the holder exits only after committing
    Task.await(holder)
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex70.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex70.Main.run()
