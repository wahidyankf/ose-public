# => Example 1: the match operator binds by shape, never by assignment.
{:ok, user} = {:ok, "ada"}
# => Rebinding points the name at a new value; nothing mutates.
user = String.upcase(user)
# => A plain name always matches, so this binds rather than compares.
name = "ada"
# => Pin keeps the old value in the pattern instead of rebinding it.
^name = "ada"
# => Print the two bindings with fixed labels.
IO.puts("user=#{user} name=#{name}")
