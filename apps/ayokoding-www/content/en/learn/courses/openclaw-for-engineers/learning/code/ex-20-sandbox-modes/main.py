# => Least privilege as a lookup table.
# => Modes grow stricter from open to locked.
modes = ["open", "supervised", "locked"]  # => the three sandbox modes, weakest first
# => modes has 3 entries (type: list)
tasks = {"read inbox": 0, "run tests": 1, "migrate database": 2}  # => each task names its minimum safe mode index
# => three fixture tasks (type: dict)
for task, need in tasks.items():  # => match each task to its weakest safe mode
    print(task + " -> " + modes[need])  # => Output: read inbox -> open, run tests -> supervised, migrate database -> locked
print("modes known: %d" % len(modes))  # => Output: modes known: 3
strictest = modes[max(tasks.values())]  # => the harshest need sets the session ceiling
# => strictest is locked
print("session ceiling: " + strictest)  # => Output: session ceiling: locked
