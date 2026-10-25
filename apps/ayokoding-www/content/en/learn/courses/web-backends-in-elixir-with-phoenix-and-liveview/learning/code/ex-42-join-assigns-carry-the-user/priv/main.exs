# => Example 42: Join Assigns Carry the User
Logger.configure(level: :warning)
# => warnings only; channels stay silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one channel module remembers who joined
defmodule Ex42.RoomChannel do
  # => join and event callbacks live here
  use Phoenix.Channel

  # => the ticket names the joining user
  def join("room:" <> _id, %{"user" => user}, socket) do
    # => the user rides into the socket assigns
    {:ok, assign(socket, :user, user)}
    # => end join: identity stored at the door
  end

  # => the who event reads the stored identity
  def handle_in("who", _payload, socket) do
    # => the reply names the joined user back
    {:reply, {:ok, %{user: socket.assigns.user}}, socket}
    # => end event: memory in, answer out
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex42.Main do
  # => single entry point the last line calls
  def run do
    # => ada joins carrying her name in the ticket
    {:ok, socket} = Ex42.RoomChannel.join("room:7", %{"user" => "ada"}, struct(Phoenix.Socket))
    # => the who event proves the socket remembers
    {:reply, {:ok, %{user: user}}, _} = Ex42.RoomChannel.handle_in("who", %{}, socket)
    # => Output: joined as: ada
    IO.puts("joined as: #{user}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex42.Main.run()
