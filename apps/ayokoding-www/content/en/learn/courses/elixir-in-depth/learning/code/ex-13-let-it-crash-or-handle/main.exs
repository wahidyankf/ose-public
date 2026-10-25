# => Example 13: let it crash inside, convert to values at the boundary.
defmodule Worker do # => the deliberately strict worker module.
  # => The worker does no defending: bad input raises, supervisors decide.
  def divide(_a, 0), do: raise(ArithmeticError, message: "zero divisor") # => zero divisor raises, never returns.
  def divide(a, b), do: a / b # => the total-looking happy clause.
end # => the module closes; Worker stays crashable by design.
# => The boundary converts crashes into tuples the caller can match on.
safe_divide = fn a, b -> # => the converting boundary both reports share.
  try do # => run the strict worker inside the boundary.
    {:ok, Worker.divide(a, b)} # => wrap the strict result as ok.
  rescue # => convert only the documented error into data.
    # => Only the documented error converts; anything else still raises.
    _ in ArithmeticError -> {:error, :zero_divisor} # => the documented conversion.
  end # => the try closes; the boundary holds a tuple either way.
end # => the boundary function closes.
# => Inside code stays total-looking; the edge owns the try boundary.
IO.puts("inside=#{Worker.divide(7, 2)}") # => the strict inside value.
# => The boundary reports errors as data while the worker stays strict.
IO.puts("safe=#{inspect(safe_divide.(7, 2))} unsafe=#{inspect(safe_divide.(7, 0))}") # => tuple reports for both inputs.
