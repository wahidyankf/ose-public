# => Channel wiring: token plus group, both required.
# => Group-less wiring is refused outright.
wiring = {"channel": "matrix-room", "token_ref": "env:MATRIX_TOKEN"}  # => channel name plus secret reference
# => token_ref names env, never the value
wiring["group"] = "public"  # => the access group caps this channel
# => public keeps it read-only
need = ["channel", "token_ref", "group"]  # => the three fields safe wiring needs
missing = [k for k in need if k not in wiring]  # => list any field the wiring forgot
# => missing is [] here
for k in need:  # => show the wiring in canonical order
    print(k + ": " + wiring[k])  # => Output: three wiring lines
bare = {"channel": "matrix-room", "token_ref": "env:MATRIX_TOKEN"}  # => a second wiring that omits the group
# => bare has only two fields
print("bare wiring refused: " + str("group" not in bare))  # => Output: bare wiring refused: True
