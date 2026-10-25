# => Example 44: Terminate Cleans the Join
Logger.configure(level: :warning)
# => warnings only; channels stay silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one channel module counts its own leavers
defmodule Ex44.RoomChannel do
  # => join and event callbacks live here
  use Phoenix.Channel

  # => room ids join freely in this lesson
  def join("room:" <> _id, _params, socket) do
    # => joins always succeed here
    {:ok, socket}
    # => end join: door always open
  end

  # => leaving runs the terminate callback
  def terminate(_reason, socket) do
    # => the farewell reaches the leaving process
    send(socket.transport_pid, :cleaned)
    # => terminate always answers ok
    :ok
    # => end terminate: goodbye sent, state dropped
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex44.Main do
  # => single entry point the last line calls
  def run do
    # => the socket names this process as transport
    socket = struct(Phoenix.Socket, transport_pid: self())
    # => join room 7 before leaving it
    {:ok, joined} = Ex44.RoomChannel.join("room:7", %{}, socket)
    # => leaving runs terminate with the joined socket
    :ok = Ex44.RoomChannel.terminate(:leave, joined)
    # => the farewell waits in the mailbox
    receive do
      # => Output: cleaned: true
      :cleaned ->
        IO.puts("cleaned: true")
        # => end receive: goodbye arrived
    after
      # => a missing farewell would fail loudly here
      1000 ->
        IO.puts("cleaned: false")
        # => end after: terminate always says goodbye
    end

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex44.Main.run()
