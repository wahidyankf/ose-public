# => Four skill parts, assembled and validated.
# => Loadable means all four present.
skill = {"name": "triage-inbox"}  # => the invocation name, first part
# => skill starts with one part
skill["inputs"] = ["inbox_path", "rules"]  # => required inputs, second part
# => inputs name what callers supply
skill["guidance"] = "read first, then summarise"  # => tool guidance, third part
# => guidance orders the tool calls
skill["rules"] = "never delete originals"  # => behavioural rules, fourth part
# => rules bound every invocation
need = ["name", "inputs", "guidance", "rules"]  # => the four parts a skill must carry
missing = [k for k in need if k not in skill]  # => list any part the skill forgot
# => missing is [] here
for k in need:  # => show the skill in canonical order
    print(k + ": " + str(skill[k]))  # => Output: four skill lines
print("loadable: " + str(len(missing) == 0))  # => Output: loadable: True
