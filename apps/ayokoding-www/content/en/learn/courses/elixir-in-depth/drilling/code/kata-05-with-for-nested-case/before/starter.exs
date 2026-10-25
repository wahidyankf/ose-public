# => Kata 5 starter: nested cases push the happy path to the far right.
parse = fn text -> # => one closure; two nesting levels inside.
  # => Outer case handles the parse; inner case guards the sign.
  case Integer.parse(text) do # => the outer case on the parse result.
    {n, ""} -> # => full parse binds n.
      case n > 0 do # => the inner case on the sign.
        true -> {:ok, n} # => positive parses succeed.
        false -> {:error, :not_positive} # => zero and negatives fail loudly.
      end # => the inner case closes.
    _ -> {:error, :not_a_number} # => partial parses fail here.
  end # => the outer case closes.
end # => the closure closes.
# => Both branches work; the nesting bills every future reader.
IO.puts("good=#{inspect(parse.("21"))} bad=#{inspect(parse.("x"))}") # => ok 21 plus the not_a_number error.
