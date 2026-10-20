# => Four audit entries exported oldest-first.
# => Completeness is verified against the action list.
entries = [("ses-001", "read inbox"), ("ses-001", "exec ls"), ("ses-001", "write digest"), ("ses-001", "message send")]  # => session plus action per entry
# => entries has 4 items (type: list)
actions = ["read inbox", "exec ls", "write digest", "message send"]  # => the privileged actions actually taken
# => actions has 4 entries (type: list)
print("entries: %d" % len(entries))  # => Output: entries: 4
for session, action in entries:  # => export oldest first, in order
    print(session + " | " + action)  # => Output: four export lines
covered = all(a in [e[1] for e in entries] for a in actions)  # => every action must appear in the export
# => covered is True
print("export complete: " + str(covered))  # => Output: export complete: True
