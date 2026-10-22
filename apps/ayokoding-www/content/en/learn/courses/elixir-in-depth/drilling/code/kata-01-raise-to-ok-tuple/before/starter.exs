# => Kata 1 starter: stringly failures force callers to parse messages.
withdraw = fn balance, amount -> # => two-argument closure; both paths live inside.
  # => Happy path subtracts; the failure path raises a bare message.
  if balance >= amount do # => the guard decides value versus raise.
    balance - amount # => happy path answers with the remainder.
  else # => the shortfall branch.
    raise "need #{amount} have #{balance}" # => stringly failure callers must parse.
  end # => the if closes; one branch always runs.
end # => the closure closes; withdraw is now callable.
# => The happy path works; the failing call would raise instead of answering.
IO.puts("left=#{withdraw.(100, 30)}") # => prints 70; the raise path stays unprinted.
