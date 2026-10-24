# => Example 10: raise for programmer errors, rescue with context at the edge.
defmodule Budget do # => the structured-exception module.
  # => defexception declares a struct with message plus context fields.
  defexception [:message, :balance, :amount] # => message plus two context fields.
end # => the module closes; Budget is now an exception type.
# => withdraw raises only when the caller broke the contract, never for input.
withdraw = fn balance, amount -> # => the withdraw function under test.
  # => Guard the precondition first; the raise names the broken rule.
  if amount > balance do # => the overdraft precondition check.
    raise Budget, message: "overdraft refused", balance: balance, amount: amount # => structured raise with context.
  else # => the contract holds; return the plain remainder.
    balance - amount # => the happy-path value, no tuple wrapping.
  end # => the if closes; one branch raises, one returns.
end # => the withdraw function closes.
# => The happy path returns a plain value with no tuple wrapping.
left = withdraw.(100, 30) # => 100 minus 30 through the happy branch.
# => rescue at the edge turns the exception back into a printable report.
report = # => the report binding the try returns into.
  try do # => run the failing withdrawal inside the boundary.
    withdraw.(10, 30) # => 10 cannot cover 30; the raise fires here.
  rescue # => convert the caught exception into report data.
    # => Pattern-match the exception struct to recover its context fields.
    e in Budget -> "refused balance=#{e.balance} amount=#{e.amount}" # => the context-carrying report.
  end # => the try closes; report holds the refusal string.
# => Print the happy value and the rescued report with fixed labels.
IO.puts("left=#{left} report=#{report}") # => the value-plus-report transcript.
