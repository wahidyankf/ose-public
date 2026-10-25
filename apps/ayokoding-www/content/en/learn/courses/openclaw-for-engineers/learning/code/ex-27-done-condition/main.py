# => Three candidate done lines, graded observable or vague.
# => Only observable lines survive.
candidates = ["tidy up a bit", "archive/ holds 4 moved files", "make it nice"]  # => one checkable line hides among two vague ones
# => candidates has 3 entries (type: list)
observable = ["archive/ holds 4 moved files"]  # => the fixture's only script-checkable line
# => observable names the survivors
kept = []  # => kept collects candidates that pass the grade
for line in candidates:  # => grade each candidate line
    ok = line in observable  # => membership stands in for the checkability test
    # => only the middle line passes
    kept.append(line) if ok else None  # => keep survivors, drop the vague lines
    # => append-or-None keeps the loop branchless
    print(("KEEP " if ok else "DROP ") + line)  # => Output: DROP tidy up a bit, KEEP archive, DROP make it nice
print("kept: %d of %d" % (len(kept), len(candidates)))  # => Output: kept: 1 of 3
print("finish is checkable: " + str(len(kept) == 1))  # => Output: finish is checkable: True
