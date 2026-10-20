# => Three fixture checks gate one proposed change.
# => All three must pass; one failure blocks the merge.
checks = [("links resolve", True), ("no stray files", True), ("index builds", False)]  # => check name plus fixture result
# => the third check fails here
passed = []  # => passed collects green checks
for name, ok in checks:  # => run each gate check in order
    print(("PASS " if ok else "FAIL ") + name)  # => Output: two PASS lines then one FAIL
    if ok:  # => green checks join the passed list
        passed.append(name)  # => passed reaches two entries
print("passed: %d of %d" % (len(passed), len(checks)))  # => Output: passed: 2 of 3
merge = len(passed) == len(checks)  # => merge only on a fully green gate
# => merge is False here
print("merge allowed: " + str(merge))  # => Output: merge allowed: False
