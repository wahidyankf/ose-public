# => Example 7: Plug Halts Unauthorized Early
Logger.configure(level: :warning)
# => warnings only; request logs never reach the transcript
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one plug module guards every request it sees
defmodule Ex07.AuthPlug do
  # => assign, header, halt, and send helpers live here
  import Plug.Conn

  # => plugs receive their options through init
  def init(opts), do: opts

  # => the secret header decides pass or halt
  def call(conn, _opts) do
    # => match the header the client was told
    case get_req_header(conn, "authorization") do
      # => the known secret lets the request through
      ["secret" <> _] ->
        assign(conn, :user, "ada")

      # => anything else answers 401 immediately
      _ ->
        conn |> send_resp(401, "denied") |> halt()
        # => end case: halted conns skip the router
    end

    # => end call: one decision, two outcomes
  end

  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Ex07.Main do
  # => single entry point the last line calls
  def run do
    # => a request with no credentials at all
    denied = Plug.Test.conn(:get, "/hello") |> Ex07.AuthPlug.call([])
    # => Output: denied: 401 halted=true denied
    IO.puts("denied: #{denied.status} halted=#{denied.halted} #{denied.resp_body}")
    # => a request carrying the shared secret
    # => the header the plug was told to expect
    allowed =
      Plug.Test.conn(:get, "/hello")
      # => put_req_header sets it before the plug runs
      |> Plug.Conn.put_req_header("authorization", "secret-1")
      # => the plug assigns instead of halting
      |> Ex07.AuthPlug.call([])

    # => Output: allowed: halted=false user=ada
    IO.puts("allowed: halted=#{allowed.halted} user=#{allowed.assigns[:user]}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex07.Main.run()
