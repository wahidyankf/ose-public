# => Example 62: mix format ends style debates; the formatter is the rule.
messy = "add( 1,2 )"
# => format_string! parses and reprints with the canonical spacing.
clean = Code.format_string!(messy) |> IO.iodata_to_binary()
# => Already-formatted code round-trips byte-identically through the tool.
stable = Code.format_string!(clean) |> IO.iodata_to_binary()
# => A committed fixture proves check-formatted passes without rewriting.
{_out, status} = System.cmd("mix", ["format", "--check-formatted", Path.join(__DIR__, "formatted.ex")])
# => Print the before and after plus the idempotence and check proofs.
IO.puts("before=#{messy} after=#{clean} stable=#{clean == stable} check=#{status}")
