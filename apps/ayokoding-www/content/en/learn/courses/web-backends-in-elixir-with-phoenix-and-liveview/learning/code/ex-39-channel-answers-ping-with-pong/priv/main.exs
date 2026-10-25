# => Example 39: Channel Answers Ping With Pong
Logger.configure(level: :warning)
# => warnings only; channels stay silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one channel module owns the room topics
defmodule Ex39.RoomChannel do
  # => join and event callbacks live here
  use Phoenix.Channel

  # => room ids join freely in this lesson
  def join("room:" <> _id, _params, socket) do
    # => joins always succeed here
    {:ok, socket}
    # => end join: door always open
  end

  # => ping answers at once, nothing stored
  def handle_in("ping", _payload, socket) do
    # => the reply carries the pong straight back
    {:reply, {:ok, %{pong: true}}, socket}
    # => end event: question in, answer out
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex39.Main do
  # => single entry point the last line calls
  def run do
    # => join room 7 before speaking
    {:ok, socket} = Ex39.RoomChannel.join("room:7", %{}, struct(Phoenix.Socket))
    # => the client pings the joined channel
    {:reply, {:ok, %{pong: true}}, _} = Ex39.RoomChannel.handle_in("ping", %{}, socket)
    # => Output: pong: true
    IO.puts("pong: true")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex39.Main.run()
