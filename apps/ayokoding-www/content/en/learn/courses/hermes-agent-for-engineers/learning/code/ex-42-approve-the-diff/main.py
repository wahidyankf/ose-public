# Example 42: Approve the Diff
# => Never trust a diff you have not read: the agent drafts, you verify.
# => The shim freezes one proposed diff as added/removed line counts.
# => Counts cannot replace reading, but they route your attention.
files = [("src/docs.py", 9, 3)]  # => path plus added and removed counts
# => Total the change: big diffs deserve slower, closer review.
added = sum(a for _, a, _ in files)  # => every added line proposed
removed = sum(r for _, _, r in files)  # => every removed line proposed
# => A file the brief never named is scope creep until proven otherwise.
print("files-touched:", len(files))
# => Added plus removed is the review surface you must actually read.
print("lines-changed:", added + removed)  # => the surface size
# => Over the threshold means split the change or pair-review it.
big = (added + removed) > 100  # => True routes to slow review
# => The flag tells you how to read, not whether to merge.
print("needs-slow-review:", big)  # => Output is the reading plan
