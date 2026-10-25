# => Example 11: try, catch, and after separate exits, throws, and cleanup.
# => A linked child that exits abnormally signals its parent, not a value.
child = spawn(fn -> exit(:boom) end) # => the doomed child; its exit is the lesson.
# => Trapping turns the exit signal into a message the parent can catch.
_ = Process.flag(:trap_exit, true) # => trap: exits arrive as messages now.
# => Catch matches exit signals; rescue would never see them.
caught = # => the caught binding the try returns into.
  try do # => link and receive inside the trapping boundary.
    # => Linking joins fates: the child exit arrives as a signal here.
    _link = Process.link(child) # => join fates with the doomed child.
    receive do # => wait for the EXIT message the trap delivers.
      # => The EXIT message carries the reason we assert on.
      {:EXIT, _from, reason} -> "caught exit: #{reason}" # => the exit report string.
    after # => bound the wait so a lost signal cannot hang the script.
      # => after bounds the wait so a lost signal cannot hang the script.
      1000 -> "no signal arrived" # => the fallback no test ever observes.
    end # => the receive closes with its bound.
  catch # => catch owns the non-trapping exit shape, kept for contrast.
    # => :exit catches signals only when the process is not trapping.
    :exit, reason -> "direct exit: #{reason}" # => the direct-exit report.
  after # => after always runs: cleanup here cannot be skipped by any path.
    # => after always runs: cleanup here cannot be skipped by any path.
    :ok # => the unconditional cleanup marker.
  end # => the try closes; caught holds the exit report.
# => A thrown value is a nonlocal return, distinct from raise and exit.
thrown = # => the thrown binding the second try returns into.
  try do # => throw past the rest of the block.
    throw(:early) # => the nonlocal return; the next line never runs.
    "unreached" # => dead by construction: the throw skips it.
  catch # => catch with a bare value matches throws without a class.
    # => catch with a bare value matches throws without a class.
    :early -> "thrown value returned early" # => the throw report string.
  end # => the try closes; thrown holds the early-return report.
# => Print the exit report and the throw report with fixed labels.
IO.puts("exit=#{caught} thrown=#{thrown}") # => the two-mechanism transcript.
