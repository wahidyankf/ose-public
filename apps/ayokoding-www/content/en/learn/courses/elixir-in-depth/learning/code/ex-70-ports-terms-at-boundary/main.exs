# => Example 70: ports talk to the outside world; terms cross as bytes.
# => Open a port to cat: bytes written in come back out, looped by the OS.
port = Port.open({:spawn, "cat"}, [:binary])
# => Send bytes with the port as destination; self() tags the sender.
send(port, {self(), {:command, "hello port"}})
# => The reply arrives as a port message with the echoed bytes attached.
echo = receive do {^port, {:data, bytes}} -> bytes after 1000 -> :timeout end
# => term_to_binary encodes any term for the wire; binary_to_term decodes.
roundtrip = %{a: 1} |> :erlang.term_to_binary() |> :erlang.binary_to_term()
# => Print the echoed bytes and the round-trip proof with fixed labels.
IO.puts("echo=#{echo} roundtrip=#{inspect(roundtrip)}")
# => Close the port; the script owns its whole lifecycle.
Port.close(port)
