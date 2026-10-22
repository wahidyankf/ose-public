# => Example 2: case matches shapes, cond guards ranges, if guards one bit.
role = :admin # => the fixed input every branch below decides on.
# => case picks the first matching shape; the wildcard catches the rest.
label = # => the label binding the case expression returns into.
  case role do # => match the role atom against each known shape.
    # => Atoms match literally, so each clause names one known role.
    :admin -> "all areas" # => first literal shape: full access areas.
    # => A second literal clause keeps the known roles explicit.
    :editor -> "edit only" # => second literal shape: editing rights.
    # => The wildcard clause is the documented fallback, not a silent hole.
    _ -> "read only" # => fallback shape: reading rights for the rest.
  end # => the case closes; label holds the chosen string.
# => cond evaluates guards top to bottom and takes the first true one.
band = # => the band binding the cond expression returns into.
  cond do # => evaluate boolean guards in order, first true wins.
    # => Guard order matters: the tightest condition comes first.
    role == :admin -> "full" # => admin guard: the full band.
    # => Looser conditions follow, each naming its own outcome.
    role == :editor -> "partial" # => editor guard: the partial band.
    # => true is the explicit else that keeps cond total.
    true -> "none" # => final guard: always true, the total else.
  end # => the cond closes; band holds the chosen string.
# => if is for one boolean with an optional else, nothing more.
note = if role == :admin, do: "root", else: "user" # => one boolean, two outcomes.
# => unless mirrors if for the negative read of the same boolean.
open = unless role == :guest, do: "open", else: "closed" # => negative read, same shape.
# => Print the four decisions with fixed labels.
IO.puts("label=#{label} band=#{band} note=#{note} open=#{open}") # => the fixed four-way report.
