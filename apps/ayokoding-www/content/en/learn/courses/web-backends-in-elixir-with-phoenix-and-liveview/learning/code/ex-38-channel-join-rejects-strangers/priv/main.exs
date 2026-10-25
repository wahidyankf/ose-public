# => Example 38: Channel Join Rejects Strangers
Logger.configure(level: :warning)
# => warnings only; channels stay silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one channel module guards the room topics
defmodule Ex38.RoomChannel do
  # => join and event callbacks live here
  use Phoenix.Channel

  # => room ids join when the ticket matches
  def join("room:" <> _id, %{"ticket" => "letmein"}, socket) do
    # => the right ticket opens the room
    {:ok, socket}
    # => end join: ticket checked, door open
  end

  # => every other join attempt turns away
  def join("room:" <> _id, _params, _socket) do
    # => the error names the reason for the client
    {:error, %{reason: "no ticket"}}
    # => end join: no ticket, no room
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex38.Main do
  # => single entry point the last line calls
  def run do
    # => a client without a ticket knocks first
    {:error, refused} = Ex38.RoomChannel.join("room:7", %{}, struct(Phoenix.Socket))
    # => Output: refused: no ticket
    IO.puts("refused: #{refused.reason}")
    # => the same client returns with the ticket
    {:ok, _} = Ex38.RoomChannel.join("room:7", %{"ticket" => "letmein"}, struct(Phoenix.Socket))
    # => Output: admitted: true
    IO.puts("admitted: true")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex38.Main.run()
