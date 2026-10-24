# => Example 16: try and after guarantee cleanup on every exit path.
path = Path.join(System.tmp_dir!(), "elixir-in-depth-ex16.txt") # => the fixed scratch path under /tmp.
# => Write the scratch file first; the read below must always clean it up.
File.write!(path, "scratch") # => seed the scratch with fixed bytes.
# => read_and_cleanup returns the content while owning the delete duty.
read_and_cleanup = fn p -> # => the owning read both reports share.
  try do # => read inside the boundary that owns the delete.
    # => The happy path reads and returns the file content.
    File.read!(p) # => the content the caller asked for.
  after # => after runs on success, raise, throw, and exit alike.
    # => after runs on success, raise, throw, and exit alike.
    File.rm(p) # => the owned delete no path can skip.
  end # => the try closes; content returns before cleanup erases.
end # => the owning function closes.
# => The content returns before the cleanup erases the evidence.
content = read_and_cleanup.(path) # => read, then the after deletes.
# => The file is gone exactly because after cannot be skipped.
exists = File.exists?(path) # => false proves the cleanup ran.
# => Print the content and the proof of cleanup with fixed labels.
IO.puts("content=#{content} exists=#{exists}") # => content plus cleanup proof.
