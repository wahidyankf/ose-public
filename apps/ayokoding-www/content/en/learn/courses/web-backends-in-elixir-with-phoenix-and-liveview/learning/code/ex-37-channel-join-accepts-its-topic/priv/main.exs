# => Example 37: Channel Join Accepts Its Topic
Logger.configure(level: :warning)
# => warnings only; channels stay silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one channel module owns the room topics
defmodule Ex37.RoomChannel do
  # => join and event callbacks live here
  use Phoenix.Channel

  # => room ids join, everything else turns away
  def join("room:" <> id, _params, socket) do
    # => the room id rides into the socket assigns
    {:ok, assign(socket, :room_id, id)}
    # => end join: topic matched, state stored
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex37.Main do
  # => single entry point the last line calls
  def run do
    # => a client asks to join room 7
    {:ok, socket} = Ex37.RoomChannel.join("room:7", %{}, struct(Phoenix.Socket))
    # => Output: joined: 7
    IO.puts("joined: #{socket.assigns.room_id}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex37.Main.run()
