# => Example 21: fixtures ship beside the script; scratch lives under /tmp.
fixture = Path.join(__DIR__, "roster.txt")
# => The working directory is the unit folder, so relative reads resolve.
rows = File.read!(fixture) |> String.split("\n", trim: true)
# => Scratch writes go to a fixed /tmp path, never into the course tree.
scratch = Path.join(System.tmp_dir!(), "elixir-in-depth-ex21.txt")
# => Write the derived content, then read it back to prove the round trip.
File.write!(scratch, Enum.join(Enum.sort(rows), "\n") <> "\n")
# => Sorted output keeps the transcript independent of fixture order.
echo = File.read!(scratch)
# => Clean up the scratch file so reruns start from the same state.
File.rm!(scratch)
# => Print the count and the sorted echo with fixed labels.
IO.puts("count=#{length(rows)}")
# => The echo ends with a newline from the join; write prints it verbatim.
IO.write("sorted:\n" <> echo)
