# => Global allow meets a session deny; deny wins.
# => The merge only ever tightens.
glob = {"exec": "allow", "browser": "ask", "message": "allow"}  # => standing global policy for three tools
# => glob maps tool to policy (type: dict)
session = {"exec": "deny"}  # => this session forbids exec entirely
# => session overrides one tool
merged = dict(glob)  # => start the merge from the global policy
# => copy, so the global is never mutated
merged.update(session)  # => session entries overwrite global ones
# => exec becomes deny in the merge
print("global exec: " + glob["exec"])  # => Output: global exec: allow
print("merged exec: " + merged["exec"])  # => Output: merged exec: deny
widened = any(merged[t] == "allow" and session.get(t) == "allow" and glob.get(t) != "allow" for t in merged)  # => detect any tool the session widened past global
# => widened is False here
print("session widened anything: " + str(widened))  # => Output: session widened anything: False
print("tighten-only holds: " + str(not widened))  # => Output: tighten-only holds: True
