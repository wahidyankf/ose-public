# => Example 68: one assembly pass beats N growing copies.
words = ["deploy", "passed", "staging"]  # => the pieces to assemble
joined = ",".join(words)  # => WHY join: sized once, filled once
print(repr(joined))  # => Output: 'deploy,passed,staging', separator placed
built = ""  # => the quadratic form: kept for the comparison
for word in words:  # => every iteration copies the whole growth so far
    built = built + "," + word if built else word  # => plus edge cases inline
print(built == joined)  # => Output: True, same text, different cost
lines = ["a", "b", "c"]  # => document lines for the newline case
print(repr("\n".join(lines)))  # => Output: 'a\nb\nc', no trailing newline
