# => Kata 1 solution: ok/error tuples carry the shortfall as data, not prose.
withdraw = fn balance, amount -> # => same shape as the starter, tuples instead of raise.
  # => Compare first; both branches return the same tuple shape.
  if balance >= amount do # => the guard decides ok versus error.
    {:ok, balance - amount} # => happy path wraps the remainder.
  else # => the shortfall branch.
    {:error, %{balance: balance, amount: amount, short: amount - balance}} # => shortfall as data, not prose.
  end # => the if closes; one tuple comes out either way.
end # => the closure closes; withdraw is now callable.
# => The happy path prints through the same match the failure path uses.
IO.puts("left=#{inspect(withdraw.(100, 30))}") # => prints {:ok, 70} through inspect.
# => Fields print explicitly: map key order is not part of the contract.
{:error, ctx} = withdraw.(10, 30) # => destructure the failure into ctx.
IO.puts("short=#{ctx.short} balance=#{ctx.balance} amount=#{ctx.amount}") # => short=20 balance=10 amount=30.
