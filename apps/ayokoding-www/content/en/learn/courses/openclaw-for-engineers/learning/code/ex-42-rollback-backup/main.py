# => Snapshot, damage, restore, verify equal.
# => The verify step is the whole point.
live = {"a.md": "alpha", "b.md": "beta"}  # => the two live fixture files
# => live maps name to content (type: dict)
snapshot = dict(live)  # => snapshot copies content before any risk
# => copy, so damage cannot alias it
live["a.md"] = "BROKEN"  # => the bad change damages one file
# => live now differs from snapshot
print("damaged: " + live["a.md"])  # => Output: damaged: BROKEN
live = dict(snapshot)  # => restore overwrites live from the snapshot
# => live is whole again
print("restored: " + live["a.md"])  # => Output: restored: alpha
verified = live == snapshot  # => equality proves a byte-exact restore
# => verified is True
print("rollback verified: " + str(verified))  # => Output: rollback verified: True
