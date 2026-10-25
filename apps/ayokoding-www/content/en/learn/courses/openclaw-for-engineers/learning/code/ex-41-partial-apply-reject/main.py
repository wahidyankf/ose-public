# => Three files, two approved; the apply must refuse.
# => Atomicity beats partial progress.
proposal = ["a.md", "b.md", "c.md"]  # => the three files the proposal covers
# => proposal has 3 entries (type: list)
approved = ["a.md", "b.md"]  # => only two files earned approval
# => c.md is still under review
whole = all(f in approved for f in proposal)  # => True only when every file is approved
# => whole is False here
print("proposal files: %d" % len(proposal))  # => Output: proposal files: 3
print("approved files: %d" % len(approved))  # => Output: approved files: 2
applied = list(proposal) if whole else []  # => apply everything or apply nothing
# => applied stays empty here
print("applied files: %d" % len(applied))  # => Output: applied files: 0
print("partial blocked: " + str(len(applied) == 0))  # => Output: partial blocked: True
