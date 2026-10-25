# => Five-point brief review; one item is missing.
# => The send blocks until the list is whole.
checks = ["goal stated", "scope bounded", "done observable", "guardrails set", "report target set"]  # => the five review points in order
# => checks has 5 entries (type: list)
brief_has = ["goal stated", "scope bounded", "done observable", "guardrails set"]  # => the candidate brief forgets its report target
# => brief_has has 4 entries (type: list)
failed = [c for c in checks if c not in brief_has]  # => list the review points the brief misses
# => failed holds one item
for c in checks:  # => report every review point
    print(("PASS " if c in brief_has else "FAIL ") + c)  # => Output: four PASS lines then one FAIL
print("failed checks: " + ", ".join(failed))  # => Output: failed checks: report target set
print("send blocked: " + str(len(failed) > 0))  # => Output: send blocked: True
