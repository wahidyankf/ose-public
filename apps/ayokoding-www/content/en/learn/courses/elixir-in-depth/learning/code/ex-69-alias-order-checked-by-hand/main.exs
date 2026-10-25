# => Keep aliases sorted: the script checks its own alias block below.
alias Enum, as: E # => the Enum shorthand this script uses.
alias String, as: S # => the String shorthand this script uses.
# => Example 69: alias blocks sort ASCII-betically; this script checks itself.
source = __ENV__.file |> File.read!() # => read this very script as text.
# => Alias lines start at column zero here, so the check stays simple.
found = source |> String.split("\n") |> E.filter(fn l -> S.starts_with?(l, "alias ") end) # => the alias lines in file order.
# => sorted? compares the block against its own sorted form, order included.
sorted? = found == E.sort(found) # => true when file order is sorted order.
# => The file under test is this very script, so the proof is self-hosting.
IO.puts("aliases=#{length(found)} sorted=#{sorted?}") # => count plus verdict.
# => Print the alias lines in file order as the auditable evidence.
IO.puts(E.join(found, "\n")) # => the alias evidence lines.
