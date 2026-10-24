# => Example 75: read a macro by its expansion, never by guessing.
# => quote captures the AST; the operator sits first in the tuple.
quoted = quote do: 1 + 2 * 3
# => elem peels the structure: operator, metadata, then arguments.
IO.puts("op=#{elem(quoted, 0)} args=#{length(elem(quoted, 2))}")
# => to_string renders the expansion the way precedence actually groups it.
expanded = Macro.to_string(quote do: (1 + 2) * 3)
# => unquote fragments splice values in; the AST stays plain data.
n = 41
spliced = Macro.to_string(quote do: unquote(n) + 1)
# => Print the operator count, the expansion, and the splice.
IO.puts("expanded=#{expanded} spliced=#{spliced}")
