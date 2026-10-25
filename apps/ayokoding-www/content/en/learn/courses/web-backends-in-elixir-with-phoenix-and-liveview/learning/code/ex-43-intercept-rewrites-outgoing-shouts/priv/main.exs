# => Example 43: Intercept Rewrites Outgoing Shouts
Logger.configure(level: :warning)
# => warnings only; channels stay silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one channel module filters its own shouts
defmodule Ex43.RoomChannel do
  # => join and event callbacks live here
  use Phoenix.Channel

  # => shouts pass through handle_out before delivery
  intercept(["shout"])

  # => room ids join freely in this lesson
  def join("room:" <> _id, _params, socket) do
    # => joins always succeed here
    {:ok, socket}
    # => end join: door always open
  end

  # => outgoing shouts gain an exclamation mark
  def handle_out("shout", %{text: text}, socket) do
    # => the rewrite lands in the socket for the test
    {:noreply, assign(socket, :last_shout, text <> "!")}
    # => end out: message in, louder message stored
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex43.Main do
  # => single entry point the last line calls
  def run do
    # => join room 7 before shouting
    {:ok, socket} = Ex43.RoomChannel.join("room:7", %{}, struct(Phoenix.Socket))
    # => the outgoing path rewrites the text
    {:noreply, next} = Ex43.RoomChannel.handle_out("shout", %{text: "hi"}, socket)
    # => Output: shout: hi!
    IO.puts("shout: #{next.assigns.last_shout}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex43.Main.run()
