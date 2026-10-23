# => Example 64: Locks Are Session Scoped
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Ex64.Repo, migration_source: "ex64_history")

# => one Repo module per unit keeps names unambiguous
defmodule Ex64.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex64.Main do
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
    {:ok, _} = Ex64.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "ex64")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202601000164_make_widgets.exs"), ~S"""
    # => the table the lock demonstration holds
    defmodule Ex64.Repo.Migrations.MakeWidgets do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the forward change
    create table(:ex64_widgets) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the table the lock covers
    end
    # => end change: down drops what up created
    end
    # => end MakeWidgets: the locked table
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Ex64.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Ex64.Repo, "DROP TABLE IF EXISTS ex64_widgets", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Ex64.Repo, scratch, :up, all: true, log: false)
    # => the holder pins one connection and takes the key
    me = self()
    # => the holder task owns key 6401 on its own connection
    # => the task runs on its own process and connection
    holder =
      Task.async(fn ->
        # => checkout pins the holder to a single connection
        Ex64.Repo.checkout(fn ->
          # => this acquire owns the key until the holder releases it
          Ecto.Adapters.SQL.query!(Ex64.Repo, "SELECT pg_advisory_lock(6401)", [])
          # => signal the script only after the key is held
          send(me, :locked)
          # => wait for the release signal before unlocking
          receive do
            # => the release signal frees the waiter
            :release ->
              # => the clause body acknowledges the signal
              :ok
              # => end receive: the signal was consumed
          end

          # => release the hold before returning the connection
          Ecto.Adapters.SQL.query!(Ex64.Repo, "SELECT pg_advisory_unlock(6401)", [])
          # => end checkout: the holder returns its connection
        end)

        # => end holder: the task exits cleanly after release
      end)

    # => wait until the holder owns the key
    receive do
      # => the locked signal confirms the hold
      :locked ->
        :ok
        # => end receive: the signal was consumed
    end

    # => the pool lends this probe a different connection
    [[other]] = Ecto.Adapters.SQL.query!(Ex64.Repo, "SELECT pg_try_advisory_lock(6401)", []).rows
    # => Output: other session: false
    IO.puts("other session: #{other}")
    # => release the holder and wait for a clean exit
    send(holder.pid, :release)
    # => the holder exits only after unlocking
    Task.await(holder)
    # => reverse everything for the next run
    Ecto.Migrator.run(Ex64.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex64.Main.run()
