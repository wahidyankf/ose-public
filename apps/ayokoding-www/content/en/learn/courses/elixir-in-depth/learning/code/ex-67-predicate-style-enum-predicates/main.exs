# => Example 67: all? and any? ask set questions; count measures the subset.
roles = [:admin, :editor]
# => all? proves the invariant for every element with no loop in sight.
every_atom = Enum.all?(roles, &is_atom/1)
# => any? stops at the first witness; the rest never runs.
has_admin = Enum.any?(roles, fn r -> r == :admin end)
# => in answers one-membership; the quantified forms answer the rest.
IO.puts("every_atom=#{every_atom} has_admin=#{has_admin} member=#{:admin in roles}")
# => count with a predicate measures without building the filtered list.
IO.puts("long=#{Enum.count(["ada", "grace", "al"], fn n -> String.length(n) > 3 end)}")
