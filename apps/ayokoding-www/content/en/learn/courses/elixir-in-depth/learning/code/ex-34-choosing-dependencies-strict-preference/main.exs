# => Example 34: prefer stdlib, then pinned hex, never a floating git ref.
defmodule Policy do # => the total-ranking policy module.
  # => The ranking is total: stdlib beats hex, hex beats git, always.
  def rank(:stdlib), do: 0 # => stdlib needs no install: rank zero.
  def rank({:hex, _vsn}), do: 1 # => pinned hex needs a lock: rank one.
  def rank({:git, _url}), do: 2 # => floating git needs trust: rank two.
  # => choose sorts candidates by rank and takes the head, no ties possible.
  def choose(cands), do: cands |> Enum.sort_by(&rank/1) |> hd() # => sort, take the head.
end # => the module closes; the ranking is now callable.
# => A stdlib candidate beats a pinned hex package for the same text job.
IO.puts("text=#{inspect(Policy.choose([{:hex, "1.4.10"}, :stdlib]))}") # => stdlib wins the text job.
# => Between hex and git, the pinned registry release wins deterministically.
IO.puts("json=#{inspect(Policy.choose([{:git, "https://example.com/j.git"}, {:hex, "1.4.10"}]))}") # => hex wins the json job.
