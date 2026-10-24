# => Example 17: choose the error shape by who consumes the failure.
defmodule Shapes do # => the two-spelling rule module.
  # => parse_ok returns tuples for callers that branch on input quality.
  def parse_ok(text) do # => the tuple spelling for branching callers.
    case Integer.parse(text) do # => match the raw parse result.
      {n, ""} -> {:ok, n} # => wrap the clean integer as ok.
      _ -> {:error, :not_a_number} # => wrap everything else as error.
    end # => the case closes; callers match on the tuple.
  end # => the tuple function closes.
  # => parse! raises for callers whose contract forbids bad input entirely.
  def parse!(text) do # => the bang spelling for contract callers.
    case Integer.parse(text) do # => match the raw parse result.
      {n, ""} -> n # => return the bare integer on success.
      _ -> raise ArgumentError, message: "not a number: #{text}" # => raise loudly on failure.
    end # => the case closes; success returns, failure raises.
  end # => the bang function closes.
end # => the module closes; both spellings live side by side.
# => Library code returns tuples; application edges convert with case.
from_tuple = # => the application-edge conversion of the tuple spelling.
  case Shapes.parse_ok("41") do # => match the tuple the library returned.
    {:ok, n} -> n + 1 # => branch the success into 42.
    {:error, _} -> 0 # => branch the failure into the default.
  end # => the case closes; from_tuple holds the converted value.
# => Scripts with no recovery path call the bang and let it raise loudly.
from_bang = Shapes.parse!("41") # => the contract call returning 41.
# => The rule: tuples cross boundaries, bangs enforce contracts, exits stay linked.
IO.puts("from_tuple=#{from_tuple} from_bang=#{from_bang}") # => the two-spelling agreement.
