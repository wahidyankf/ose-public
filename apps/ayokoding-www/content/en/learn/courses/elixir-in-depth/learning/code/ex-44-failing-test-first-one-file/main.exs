# => Example 44: red first proves the test can fail; green proves the fix.
ExUnit.start(auto_run: false, seed: 0, formatters: []) # => no autorun, fixed seed, silent formatters.
import ExUnit.Assertions # => assert outside tests needs the import.
# => The stub returns fizz for everything, so fifteen fails the requirement.
defmodule FizzBroken do # => the always-fizz stub module.
  def fizzbuzz(_), do: "fizz" # => every input gets fizz, including fifteen.
end # => the stub module closes.
# => Red: rescue the assertion error and print the proof it failed.
red = # => the red-proof binding the try returns into.
  try do # => assert the requirement against the stub.
    assert FizzBroken.fizzbuzz(15) == "fizzbuzz" # => fifteen is not fizzbuzz here.
    "unexpected green" # => dead unless the stub ever passes.
  rescue # => convert the assertion failure into the red proof.
    _ in ExUnit.AssertionError -> "red: stub says fizz" # => the failure is the proof.
  end # => the try closes; red holds the proof string.
# => The fix handles every divisor branch plus the plain-number fallback.
defmodule FizzFixed do # => the four-branch fix module.
  def fizzbuzz(n) do # => dispatch on divisibility, specific first.
    cond do # => first true branch wins, fifteen matches first.
      rem(n, 15) == 0 -> "fizzbuzz" # => the fifteen branch.
      rem(n, 3) == 0 -> "fizz" # => the three branch.
      rem(n, 5) == 0 -> "buzz" # => the five branch.
      true -> Integer.to_string(n) # => the plain-number fallback.
    end # => the cond closes; one string comes out.
  end # => the function closes.
end # => the fix module closes.
# => Green: the suite pins all four branches against the fixed module.
defmodule FizzFacts do # => the green facts module.
  use ExUnit.Case, async: false # => sequential cases, fixed order.
  test "divisors split four ways" do # => the four-branch fact.
    assert FizzFixed.fizzbuzz(15) == "fizzbuzz" # => fifteen takes the first branch.
    assert FizzFixed.fizzbuzz(3) == "fizz" # => three takes the second branch.
    assert FizzFixed.fizzbuzz(5) == "buzz" # => five takes the third branch.
    assert FizzFixed.fizzbuzz(7) == "7" # => seven takes the fallback.
  end # => the test closes; four asserts ran.
end # => the facts module closes; one test registered.
# => The summary as data closes the loop: one test, zero failures.
green = ExUnit.run() # => run silently, collect the summary map.
# => Print the red proof and the green summary with fixed labels.
IO.puts(red) # => the red phase proof.
IO.puts("green: #{green.total} tests, #{green.failures} failures") # => the green phase summary.
