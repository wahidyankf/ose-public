# => Example 59: supervisors restart children; the service survives crashes.
defmodule Flaky do # => the crashable supervised child.
  # => A GenServer child whose start argument the supervisor replays on crash.
  use GenServer # => wire the OTP behaviour into this module.
  def start_link(n), do: GenServer.start_link(__MODULE__, n, name: __MODULE__) # => start registered under Flaky.
  @impl GenServer # => tie init to its callback.
  def init(n), do: {:ok, n} # => the state starts as the argument.
  @impl GenServer # => tie the get clause to its callback.
  def handle_call(:get, _from, n), do: {:reply, n, n} # => reply the state unchanged.
end # => the child module closes.
# => one_for_one restarts exactly the crashed child with its start argument.
{:ok, sup} = Supervisor.start_link([{Flaky, 7}], strategy: :one_for_one) # => supervise Flaky starting at 7.
# => The first read proves the child started with its argument.
before = GenServer.call(Flaky, :get) # => read seven before the crash.
# => Kill the child; the supervisor restarts it with the same argument.
Process.exit(Process.whereis(Flaky), :kill) # => kill the child for real.
# => Poll the name until the restarted child answers; the value is fixed.
after_crash = # => the post-restart read the poll produces.
  Stream.repeatedly(fn -> # => retry until the restarted child answers.
    try do # => call the registered name; miss while it restarts.
      GenServer.call(Flaky, :get) # => the read that succeeds after restart.
    rescue # => convert the restart window into a retry marker.
      _ -> :waiting # => not back yet; find keeps polling.
    end # => the try closes; each poll returns seven or waiting.
  end) # => the infinite poll stream closes.
  |> Enum.find(fn x -> x != :waiting end) # => take the first real answer.
# => Print both reads: the restart restored the initial state exactly.
IO.puts("before=#{before} after=#{after_crash}") # => seven before, seven after.
# => Stop the supervisor; the script owns its whole lifecycle.
Supervisor.stop(sup) # => stop what the script started.
