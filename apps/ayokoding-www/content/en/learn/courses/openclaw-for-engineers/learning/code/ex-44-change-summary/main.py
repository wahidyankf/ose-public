# => Four summary lines from one change record.
# => Risks and rollback are mandatory, not optional.
summary = {}  # => the review summary starts empty
summary["files"] = "a.md, b.md (2 changed)"  # => what the change touches
# => files is the first line
summary["tests"] = "link checker passes"  # => the proof the change works
# => tests are the second line
summary["risks"] = "index rebuild may lag"  # => the honest danger, stated plainly
# => risks are the third line
summary["rollback"] = "snapshot ses-001-42"  # => the way back if review was wrong
# => rollback is the fourth line
need = ["files", "tests", "risks", "rollback"]  # => the four lines every summary must carry
missing = [k for k in need if k not in summary]  # => list any line the summary forgot
# => missing is [] here
for k in need:  # => show the summary in canonical order
    print(k + ": " + summary[k])  # => Output: four summary lines
print("review-ready: " + str(len(missing) == 0))  # => Output: review-ready: True
