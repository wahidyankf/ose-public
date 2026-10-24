# => Fixed: coherence gates alongside size.
# => The incoherent file is escalated.
proposal = {"a.md": 5, "b.md": 45}  # => same two files, same sizes
# => facts did not change, judgement did
refs = {"a.md": [], "b.md": ["ghost.md"]}  # => b.md still cites absent ghost.md
# => now the reference is tested
repo = ["a.md", "b.md"]  # => files already in the repository
# => ghost.md is in neither set
for name, changed in proposal.items():  # => judge each file on both gates
    coherent = all(r in proposal or r in repo for r in refs[name])  # => FIX: every reference must exist
    # => b.md fails here
    ok = (changed <= 10) and coherent  # => small AND coherent wins
    # => a.md passes, b.md fails
    print(name + ": " + ("approved" if ok else "escalated"))  # => Output: a.md approved, b.md escalated
