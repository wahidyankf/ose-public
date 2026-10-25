# => Fixed: file claims decide.
# => The missing file fails the trace.
claims = ["inbox.md", "archive.md"]  # => files the trace claims to touch
# => archive.md is the lie
workspace = ["inbox.md"]  # => the only file really present
# => ground truth, unchanged
bad = [f for f in claims if f not in workspace]  # => FIX: check claims against the listing
# => bad holds archive.md
print("unverified claims: " + ", ".join(bad))  # => Output: unverified claims: archive.md
print("trust: " + str(len(bad) == 0))  # => Output: trust: False, correctly
