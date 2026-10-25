# => Example 34: Js Commands Stay Client Side
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => run/0 holds the whole example narrative
defmodule Ex34.Main do
  # => single entry point the last line calls
  def run do
    # => JS commands are plain data until the client runs them
    # => push names the event the server will receive
    ops =
      Phoenix.LiveView.JS.push("save")
      # => show reveals the dialog without a round trip
      |> Phoenix.LiveView.JS.show(to: "#dialog")
      # => hide dismisses it again, still client side
      |> Phoenix.LiveView.JS.hide(to: "#dialog")

    # => Output: ops: 3 first: push
    IO.puts("ops: #{length(ops.ops)} first: #{ops.ops |> hd() |> hd()}")
    # => nothing above touched the server process
    IO.puts("server round trips: 0")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex34.Main.run()
