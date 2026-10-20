# => Buggy: size alone decides, references unchecked.
# => An incoherent file is approved.
proposal = {"a.md": 5, "b.md": 45}  # => two proposed files with sizes
# => b.md cites a missing file
refs = {"a.md": [], "b.md": ["ghost.md"]}  # => b.md references absent ghost.md
# => coherence is never tested
for name, changed in proposal.items():  # => judge each file by size only
    ok = changed < 40  # => BUG: no coherence check at all
    # => b.md passes on size
    print(name + ": " + ("approved" if ok else "escalated"))  # => Output: both files approved, wrongly
