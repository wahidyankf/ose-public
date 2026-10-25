# => Example 64: Erlang modules are one colon away; no dependency needed.
# => :math ships the transcendental functions the BEAM already links.
hyp = :math.sqrt(3 * 3 + 4 * 4)
# => :lists sorts with the battle-tested implementation under Enum.
sorted = :lists.sort([3, 1, 2])
# => :crypto hashes with NIF speed; the digest is fixed for fixed input.
digest = :crypto.hash(:sha256, "ada") |> Base.encode16(case: :lower)
# => :maps answers size with the same semantics as the Elixir twin.
size = :maps.size(%{a: 1, b: 2})
# => Print the hypotenuse, the sort, the digest prefix, and the size.
IO.puts("hyp=#{hyp} sorted=#{inspect(sorted)} sha=#{String.slice(digest, 0, 8)} size=#{size}")
