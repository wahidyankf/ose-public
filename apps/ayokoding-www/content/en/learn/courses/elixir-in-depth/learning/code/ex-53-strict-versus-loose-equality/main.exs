# => Example 53: == compares value across types; === demands the same type.
# => Loose equality coerces integers and floats by numeric value.
IO.puts("loose=#{1 == 1.0} strict=#{1 === 1.0}") # => value-equal, type-different.
# => Atoms and strings never equal each other, however similar they read.
IO.puts("atom_string=#{"ada" == :ada} same_atom=#{"ada" === "ada"}") # => cross-type false, same-type true.
# => match? with a pinned type separates the two equalities in practice.
check = fn value -> # => the branch-order checker both cases share.
  cond do # => strict first, loose second, fallback last.
    value === 1 -> "integer one" # => the strict branch: integer one only.
    value == 1 -> "numeric one" # => the loose branch: numeric ones.
    true -> "other" # => the fallback for everything else.
  end # => the cond closes; order decides the answer.
end # => the checker function closes.
# => The integer takes the strict branch; the float takes the loose one.
IO.puts("int=#{check.(1)} float=#{check.(1.0)} other=#{check.(2)}") # => strict, loose, fallback.
