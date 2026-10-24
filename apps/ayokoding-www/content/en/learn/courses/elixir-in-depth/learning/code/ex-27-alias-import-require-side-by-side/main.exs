# => Example 27: alias shortens, import injects, require enables macros.
alias String, as: S
# => import brings named functions into scope; only: keeps it tight.
import Enum, only: [map: 2, sum: 1]
# => require is for macros; Integer hosts the guard-safe parity checks.
require Integer
# => The alias reads as a namespace shorthand in every later call.
upper = S.upcase("ada")
# => Imported functions call without their module prefix.
total = [1, 2, 3] |> map(fn x -> x * 10 end) |> sum()
# => is_odd is a guard-safe macro call; require makes that legal.
odd = Integer.is_odd(7)
# => Print the three results with fixed labels.
IO.puts("upper=#{upper} total=#{total} odd=#{odd}")
