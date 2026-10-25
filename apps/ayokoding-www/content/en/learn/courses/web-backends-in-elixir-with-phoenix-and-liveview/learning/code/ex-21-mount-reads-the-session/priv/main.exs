# => Example 21: Mount Reads the Session
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module signs the page per user
defmodule Ex21.Dashboard do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => the session carries the signed user id
  def mount(_params, %{"user_id" => user_id}, socket) do
    # => the page knows who it renders for
    {:ok, assign(socket, user_id: user_id)}
    # => end mount: session in, identity out
  end

  # => the template signs with the user id
  def render(assigns), do: ~H"<p>signed {@user_id}</p>"
  # => end view: one session key, one line
end

# => run/0 holds the whole example narrative
defmodule Ex21.Main do
  # => single entry point the last line calls
  def run do
    # => mount with a signed session for user 7
    {:ok, socket} = Ex21.Dashboard.mount(%{}, %{"user_id" => 7}, struct(Phoenix.LiveView.Socket))
    # => the session value survived into assigns
    html =
      Ex21.Dashboard.render(socket.assigns)
      |> Phoenix.HTML.Safe.to_iodata()
      |> IO.iodata_to_binary()

    # => Output: html: <p>signed 7</p>
    IO.puts("html: #{html}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex21.Main.run()
